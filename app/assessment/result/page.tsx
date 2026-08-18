import { redirect } from "next/navigation";

/** 旧结果页并入画像：深度分析走 /profile/analysis */
export default function AssessmentResultRedirect() {
  redirect("/profile");
}
