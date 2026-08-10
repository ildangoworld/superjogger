export type CrewRole = "OWNER" | "MEMBER";

export type CrewProgressStatus = "ACHIEVED" | "IN_PROGRESS" | "NOT_STARTED";

export type CrewJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CrewSummary = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  role: CrewRole;
  memberCount: number;
  isPublic: boolean;
};

export type PublicCrewCard = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  pendingRequest: boolean;
};

export type CrewPreview = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  inviteCode: string | null;
  memberCount: number;
  isMember: boolean;
  pendingRequest: boolean;
  isOwner: boolean;
};

export type CrewJoinRequest = {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  message: string | null;
  status: CrewJoinRequestStatus;
  createdAt: string;
};

export type CrewBoardMember = {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  role: CrewRole;
  targetCount: number | null;
  qualifiedDayCount: number;
  achievementPercent: number | null;
  status: CrewProgressStatus;
  gradeLabel: string;
  isSelf: boolean;
};

export const CREW_PROGRESS_STATUS_LABELS: Record<CrewProgressStatus, string> = {
  ACHIEVED: "목표 달성",
  IN_PROGRESS: "진행 중",
  NOT_STARTED: "시작 전",
};
