import { z } from "zod";

export const workoutCategorySchema = z.enum(["RUNNING", "WALKING", "MIXED"]);

export const workoutInputSchema = z
  .object({
    category: workoutCategorySchema,
    localDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아요."),
    localTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "시작 시각 형식이 올바르지 않아요."),
    distanceKm: z.coerce.number().min(0, "거리는 0 이상이어야 해요."),
    hours: z.coerce.number().int().min(0).max(23),
    minutes: z.coerce.number().int().min(0).max(59),
    seconds: z.coerce.number().int().min(0).max(59),
    perceivedExertion: z.coerce.number().int().min(1).max(5),
    conditionScore: z.coerce.number().int().min(1).max(5),
    hasPain: z.boolean(),
    painArea: z.string().trim().max(80).optional().nullable(),
    painDetails: z.string().trim().max(500).optional().nullable(),
    averageHeartRate: z.coerce
      .number()
      .int()
      .min(30)
      .max(250)
      .optional()
      .nullable(),
    cadence: z.coerce.number().int().min(0).optional().nullable(),
    stepCount: z.coerce.number().int().min(0).optional().nullable(),
    memo: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const duration =
      data.hours * 3600 + data.minutes * 60 + data.seconds;
    if (duration <= 0 && data.distanceKm <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "거리 또는 운동시간 중 하나 이상 입력해 주세요.",
        path: ["distanceKm"],
      });
    }
    if (data.hasPain) {
      if (!data.painArea && !data.painDetails) {
        ctx.addIssue({
          code: "custom",
          message: "통증이 있다면 부위나 상세 내용을 적어 주세요.",
          path: ["painArea"],
        });
      }
    }
  });

export type WorkoutInput = z.infer<typeof workoutInputSchema>;
