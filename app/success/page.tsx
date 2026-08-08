import Link from "next/link";
import { LabMark } from "@/components/marks";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ form?: string }> }) {
  const { form } = await searchParams;
  const isReview = form === "review";
  return (
    <section className="success-page shell">
      <LabMark>{isReview ? "REVIEW / RECEIVED" : "REQUEST / RECEIVED"}</LabMark>
      <span className="success-icon">✓</span>
      <h1>{isReview ? "Спасибо за отзыв" : "Заявка отправлена"}</h1>
      <p>{isReview ? "Я проверю данные и свяжусь с вами, если потребуется уточнение. После модерации отзыв появится на сайте." : "Я уже получил ваши данные, изучу задачу и свяжусь с вами выбранным способом в течение одного рабочего дня."}</p>
      <Link className="button" href="/">Вернуться на главную →</Link>
    </section>
  );
}
