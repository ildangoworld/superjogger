export type InquiryStatus = "OPEN" | "ANSWERED" | "CLOSED";

export type Inquiry = {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  answerContent: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  createdAt: string;
};

export type InquiryRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: InquiryStatus;
  answer_content: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
};

export type AdminInquiryListItem = {
  id: string;
  title: string;
  status: InquiryStatus;
  createdAt: string;
  userId: string;
  authorNickname: string;
  authorEmail: string | null;
};

export type AdminInquiryDetail = Inquiry & {
  authorNickname: string;
  authorEmail: string | null;
};
