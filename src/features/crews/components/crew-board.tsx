import {
  LeaveCrewButton,
  RemoveMemberButton,
} from "@/features/crews/components/crew-member-actions";
import { CrewJoinRequestsPanel } from "@/features/crews/components/crew-join-requests";
import { InviteCrewButton } from "@/features/crews/components/invite-crew-button";
import {
  CREW_PROGRESS_STATUS_LABELS,
  type CrewBoardMember,
  type CrewJoinRequest,
  type CrewSummary,
} from "@/features/crews/types";

export function CrewBoard({
  crew,
  weekStart,
  members,
  isOwner,
  joinRequests = [],
}: {
  crew: CrewSummary;
  weekStart: string;
  members: CrewBoardMember[];
  isOwner: boolean;
  joinRequests?: CrewJoinRequest[];
}) {
  const groups: Array<{
    status: CrewBoardMember["status"];
    items: CrewBoardMember[];
  }> = [
    { status: "ACHIEVED", items: [] },
    { status: "IN_PROGRESS", items: [] },
    { status: "NOT_STARTED", items: [] },
  ];

  for (const member of members) {
    const group = groups.find((item) => item.status === member.status);
    group?.items.push(member);
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-pine-900 text-2xl font-semibold">{crew.name}</h1>
            <p className="text-muted mt-2 text-xs font-medium">
              {crew.isPublic ? "공개 크루" : "비공개 크루"}
            </p>
          </div>
          <InviteCrewButton inviteCode={crew.inviteCode} />
        </div>
        {crew.description ? (
          <p className="text-muted mt-3 text-sm leading-6">{crew.description}</p>
        ) : null}
        <p className="text-muted mt-3 text-sm">
          이번 주 ({weekStart}~) · 멤버 {crew.memberCount}명
        </p>
      </div>

      {isOwner ? <CrewJoinRequestsPanel requests={joinRequests} /> : null}

      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.status}>
            <h2 className="text-pine-900 text-base font-semibold">
              {CREW_PROGRESS_STATUS_LABELS[group.status]}
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {group.items.map((member) => (
                <li
                  key={member.userId}
                  className="border-line rounded-lg border px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-pine-900 font-semibold">
                        {member.nickname}
                        {member.isSelf ? (
                          <span className="text-muted ml-2 text-xs font-medium">
                            나
                          </span>
                        ) : null}
                        {member.role === "OWNER" ? (
                          <span className="text-pine-600 ml-2 text-xs font-medium">
                            리더
                          </span>
                        ) : null}
                      </p>
                      <p className="text-muted mt-1 text-sm">
                        {member.gradeLabel}
                        {member.targetCount != null
                          ? ` · ${member.qualifiedDayCount}/${member.targetCount}회`
                          : ` · 인정 ${member.qualifiedDayCount}회 · 목표 미설정`}
                        {member.achievementPercent != null
                          ? ` · ${member.achievementPercent}%`
                          : ""}
                      </p>
                    </div>
                    {isOwner && !member.isSelf ? (
                      <RemoveMemberButton
                        crewId={crew.id}
                        memberUserId={member.userId}
                        nickname={member.nickname}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}

      <LeaveCrewButton
        crewId={crew.id}
        isOwner={isOwner}
        memberCount={crew.memberCount}
      />
    </section>
  );
}
