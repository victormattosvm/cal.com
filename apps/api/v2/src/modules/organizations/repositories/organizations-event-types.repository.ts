import { DatabaseTeamEventType } from "@/modules/organizations/services/event-types/output.service";
import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrganizationsEventTypesRepository {
  constructor(private readonly dbRead: PrismaReadService, private readonly dbWrite: PrismaWriteService) {}

  async getTeamEventType(teamId: number, eventTypeId: number): Promise<DatabaseTeamEventType | null> {
    return this.dbRead.prisma.eventType.findUnique({
      where: {
        id: eventTypeId,
        teamId,
      },
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getTeamEventTypeBySlug(teamId: number, eventTypeSlug: string): Promise<DatabaseTeamEventType | null> {
    return this.dbRead.prisma.eventType.findUnique({
      where: {
        teamId_slug: {
          teamId,
          slug: eventTypeSlug,
        },
      },
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getTeamEventTypes(teamId: number): Promise<DatabaseTeamEventType[]> {
    return this.dbRead.prisma.eventType.findMany({
      where: {
        teamId,
      },
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getEventTypeById(eventTypeId: number): Promise<DatabaseTeamEventType | null> {
    return this.dbRead.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getEventTypeChildren(eventTypeId: number): Promise<DatabaseTeamEventType[]> {
    return this.dbRead.prisma.eventType.findMany({
      where: { parentId: eventTypeId },
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getTeamsEventTypes(orgId: number, skip: number, take: number): Promise<DatabaseTeamEventType[]> {
    return this.dbRead.prisma.eventType.findMany({
      where: {
        team: {
          parentId: orgId,
        },
      },
      skip,
      take,
      include: { users: true, schedule: true, hosts: true },
    });
  }

  async getEventTypeByIdWithChildren(eventTypeId: number) {
    return this.dbRead.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { children: true },
    });
  }
}
