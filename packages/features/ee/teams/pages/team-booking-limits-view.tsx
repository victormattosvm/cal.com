"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

import { AppearanceSkeletonLoader } from "@calcom/features/ee/components/CommonSkeletonLoaders";
import { IntervalLimitsManager } from "@calcom/features/eventtypes/components/tabs/limits/EventLimitsTab";
import SectionBottomActions from "@calcom/features/settings/SectionBottomActions";
import { classNames } from "@calcom/lib";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useParamsWithFallback } from "@calcom/lib/hooks/useParamsWithFallback";
import { MembershipRole } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import type { RouterOutputs } from "@calcom/trpc/react";
import type { IntervalLimit } from "@calcom/types/Calendar";
import { Button, Form, Meta, SettingsToggle, showToast } from "@calcom/ui";

import { getLayout } from "../../../settings/layouts/SettingsLayout";

type ProfileViewProps = { team: RouterOutputs["viewer"]["teams"]["getMinimal"] };

const BookingLimitsView = ({ team }: ProfileViewProps) => {
  const { t } = useLocale();
  const utils = trpc.useUtils();

  const form = useForm<{ bookingLimits?: IntervalLimit }>({
    defaultValues: {
      bookingLimits: team?.bookingLimits || undefined,
    },
  });

  const {
    formState: { isSubmitting, isDirty },
    reset,
  } = form;

  const mutation = trpc.viewer.teams.update.useMutation({
    onError: (err) => {
      showToast(err.message, "error");
    },
    async onSuccess(res) {
      await utils.viewer.teams.get.invalidate();
      if (res) {
        reset({ bookingLimits: res.bookingLimits });
      }
      showToast(t("booking_limits_updated_successfully"), "success");
    },
  });

  const isAdmin =
    team && (team.membership.role === MembershipRole.OWNER || team.membership.role === MembershipRole.ADMIN);

  return (
    <>
      <Meta
        title={t("booking_limits")}
        description={t("booking_limits_team_description")}
        borderInShellHeader={false}
      />
      {isAdmin ? (
        <>
          <Form
            form={form}
            handleSubmit={(values) => {
              mutation.mutate({ ...values, id: team.id });
            }}>
            <Controller
              name="bookingLimits"
              render={({ field: { value } }) => {
                const isChecked = Object.keys(value ?? {}).length > 0;
                return (
                  <SettingsToggle
                    toggleSwitchAtTheEnd={true}
                    labelClassName="text-sm"
                    title={t("limit_booking_frequency")}
                    description={t("limit_team_booking_frequency_description")}
                    checked={isChecked}
                    onCheckedChange={(active) => {
                      if (active) {
                        form.setValue("bookingLimits", {
                          PER_DAY: 1,
                        });
                      } else {
                        form.setValue("bookingLimits", {});
                      }
                      const bookingLimits = form.getValues("bookingLimits");
                      mutation.mutate({ bookingLimits, id: team.id });
                    }}
                    switchContainerClassName={classNames(
                      "border-subtle mt-6 rounded-lg border py-6 px-4 sm:px-6",
                      isChecked && "rounded-b-none"
                    )}
                    childrenClassName="lg:ml-0">
                    <div className="border-subtle border border-y-0 p-6">
                      <IntervalLimitsManager propertyName="bookingLimits" defaultLimit={1} step={1} />
                    </div>
                    <SectionBottomActions className="mb-6" align="end">
                      <Button disabled={isSubmitting || !isDirty} type="submit" color="primary">
                        {t("update")}
                      </Button>
                    </SectionBottomActions>
                  </SettingsToggle>
                );
              }}
            />
          </Form>
        </>
      ) : (
        <div className="border-subtle rounded-md border p-5">
          <span className="text-default text-sm">{t("only_owner_change")}</span>
        </div>
      )}
    </>
  );
};

const BookingLimitsViewWrapper = () => {
  const router = useRouter();
  const params = useParamsWithFallback();

  const { t } = useLocale();

  const {
    data: team,
    isPending,
    error,
  } = trpc.viewer.teams.getMinimal.useQuery(
    { teamId: Number(params.id) },
    {
      enabled: !!Number(params.id),
    }
  );

  if (isPending)
    return (
      <AppearanceSkeletonLoader
        title={t("booking_limits")}
        description={t("booking_limits_team_description")}
      />
    );

  if (!team) return null;

  return <BookingLimitsView team={team} />;
};

BookingLimitsViewWrapper.getLayout = getLayout;

export default BookingLimitsViewWrapper;
