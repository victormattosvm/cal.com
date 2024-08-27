import { BookingsRepository_2024_08_13 } from "@/ee/bookings/2024-08-13/bookings.repository";
import { Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { DateTime } from "luxon";
import { z } from "zod";

import { BookingOutput_2024_08_13, RecurringBookingOutput_2024_08_13 } from "@calcom/platform-types";
import { Booking } from "@calcom/prisma/client";

export const bookingResponsesSchema = z.object({
  email: z.string(),
  name: z.string(),
  guests: z.array(z.string()).optional(),
  rescheduledReason: z.string().optional(),
});

@Injectable()
export class OutputBookingsService_2024_08_13 {
  constructor(private readonly bookingsRepository: BookingsRepository_2024_08_13) {}

  getOutputBooking(
    databaseBooking: Booking & {
      attendees: {
        name: string;
        email: string;
        timeZone: string;
        locale: string | null;
        noShow: boolean | null;
      }[];
    }
  ) {
    const dateStart = DateTime.fromISO(databaseBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(databaseBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(databaseBooking.responses);
    const attendee = databaseBooking.attendees.find((attendee) => attendee.email === bookingResponses.email);

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: databaseBooking.id,
      uid: databaseBooking.uid,
      hostId: databaseBooking.userId,
      status:
        databaseBooking.rescheduled && !databaseBooking.cancellationReason
          ? "rescheduled"
          : databaseBooking.status.toLowerCase(),
      cancellationReason: databaseBooking.cancellationReason || undefined,
      reschedulingReason: bookingResponses?.rescheduledReason,
      rescheduledFromUid: databaseBooking.fromReschedule || undefined,
      start: databaseBooking.startTime,
      end: databaseBooking.endTime,
      duration,
      eventTypeId: databaseBooking.eventTypeId,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      },
      guests: bookingResponses.guests,
      meetingUrl: databaseBooking.location,
      absentHost: !!databaseBooking.noShowHost,
    };

    return plainToClass(BookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }

  getOutputRescheduledBooking(
    oldDatabaseBooking: Booking & {
      attendees: {
        name: string;
        email: string;
        timeZone: string;
        locale: string | null;
        noShow: boolean | null;
      }[];
    },
    newDatabaseBooking: Booking & {
      attendees: {
        name: string;
        email: string;
        timeZone: string;
        locale: string | null;
        noShow: boolean | null;
      }[];
    }
  ) {
    const dateStart = DateTime.fromISO(oldDatabaseBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(oldDatabaseBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(oldDatabaseBooking.responses);
    const bookingResponsesNew = bookingResponsesSchema.parse(newDatabaseBooking.responses);
    const attendee = oldDatabaseBooking.attendees.find(
      (attendee) => attendee.email === bookingResponses.email
    );

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: oldDatabaseBooking.id,
      uid: oldDatabaseBooking.uid,
      hostId: oldDatabaseBooking.userId,
      status:
        oldDatabaseBooking.rescheduled && !oldDatabaseBooking.cancellationReason
          ? "rescheduled"
          : oldDatabaseBooking.status.toLowerCase(),
      cancellationReason: oldDatabaseBooking.cancellationReason || undefined,
      reschedulingReason: bookingResponsesNew?.rescheduledReason,
      rescheduledFromUid: oldDatabaseBooking.fromReschedule || undefined,
      rescheduledToUid: newDatabaseBooking.uid,
      start: oldDatabaseBooking.startTime,
      end: oldDatabaseBooking.endTime,
      duration,
      eventTypeId: oldDatabaseBooking.eventTypeId,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      },
      guests: bookingResponses.guests,
      meetingUrl: oldDatabaseBooking.location,
      absentHost: !!oldDatabaseBooking.noShowHost,
    };

    return plainToClass(BookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }

  async getOutputRecurringBookings(
    databaseBookings: (Booking & {
      attendees: {
        name: string;
        email: string;
        timeZone: string;
        locale: string | null;
        noShow: boolean | null;
      }[];
    })[]
  ) {
    const transformed = [];

    for (const booking of databaseBookings) {
      if (!booking.id) {
        throw new Error("Booking was not created");
      }

      const databaseBooking = await this.bookingsRepository.getByIdWithAttendees(booking.id);
      if (!databaseBooking) {
        throw new Error(`Booking with id=${booking.id} was not found in the database`);
      }

      transformed.push(this.getOutputRecurringBooking(databaseBooking));
    }

    return transformed;
  }

  getOutputRecurringBooking(
    databaseBooking: Booking & {
      attendees: {
        name: string;
        email: string;
        timeZone: string;
        locale: string | null;
        noShow: boolean | null;
      }[];
    }
  ) {
    const dateStart = DateTime.fromISO(databaseBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(databaseBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(databaseBooking.responses);
    const attendee = databaseBooking.attendees.find((attendee) => attendee.email === bookingResponses.email);

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: databaseBooking.id,
      uid: databaseBooking.uid,
      hostId: databaseBooking.userId,
      status: databaseBooking.status.toLowerCase(),
      cancellationReason: databaseBooking.cancellationReason || undefined,
      start: databaseBooking.startTime,
      end: databaseBooking.endTime,
      duration,
      eventTypeId: databaseBooking.eventTypeId,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      },
      guests: bookingResponses.guests,
      meetingUrl: databaseBooking.location,
      recurringBookingUid: databaseBooking.recurringEventId,
      absentHost: !!databaseBooking.noShowHost,
    };

    return plainToClass(RecurringBookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }
}