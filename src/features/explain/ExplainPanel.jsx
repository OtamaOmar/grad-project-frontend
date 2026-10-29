import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge, Icon, IconButton } from "@/components/ui";
import { askExplanation, EXPLAIN_QUESTION_MAX } from "@/services/api/explanations";
import { cn } from "@/utils/cn";

/**
 * The "Explain" side panel from the designs. Answers explain stored rules and numbers;
 * they are never shown as a decision.
 */
export function ExplainPanel({ role, onClose, className }) {
  const { t } = useTranslation(["explain", "common"]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const mutation = useMutation({
    mutationFn: askExplanation,
    onSuccess: (data) =>
      setMessages((list) => [...list, { from: "assistant", ...data, id: crypto.randomUUID() }]),
    onError: (error) =>
      setMessages((list) => [
        ...list,
        { from: "assistant", refused: true, answer: error.message, id: crypto.randomUUID() },
      ]),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, mutation.isPending]);

  const tooLong = question.length > EXPLAIN_QUESTION_MAX;

  const submit = (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || tooLong || mutation.isPending) return;
    setMessages((list) => [...list, { from: "user", answer: text, id: crypto.randomUUID() }]);
    setQuestion("");
    mutation.mutate({ kind: "rule", question: text });
  };

  return (
    <section aria-label={t("title")} className={cn("flex h-full flex-col", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-outline-variant/70 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-headline-md font-semibold text-on-surface">
            <Icon name="rule" size={22} className="text-primary" />
            {t("title")}
          </h2>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{t(`tag.${role}`, { defaultValue: t("tag.admin") })}</Badge>
          {onClose && (
            <IconButton
              icon="close"
              label={t("common:actions.close", { defaultValue: "Close" })}
              size="sm"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface"
            />
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            <Icon name="info" size={16} />
            {t("scopeTitle")}
          </p>
          <p className="mt-2 text-body-md text-on-surface">
            {t(`scope.${role}`, { defaultValue: t("scope.admin") })}
          </p>
        </div>

        {messages.map((message) =>
          message.from === "user" ? (
            <p
              key={message.id}
              className="ms-8 rounded-lg rounded-se-sm bg-primary px-4 py-3 text-body-md text-on-primary shadow-sm"
            >
              {message.answer}
            </p>
          ) : (
            <div
              key={message.id}
              className={cn(
                "me-6 rounded-lg rounded-ss-sm border px-4 py-3 text-body-md shadow-sm",
                message.refused
                  ? "border-warning/30 bg-warning-container/60 text-on-warning-container"
                  : "border-outline-variant bg-surface-container-low text-on-surface",
              )}
            >
              {message.refused && <p className="mb-1 font-semibold">{t("refused")}</p>}
              <p>{message.answer}</p>
              {message.citations?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {message.citations.map((citation) => (
                    <li key={citation.id}>
                      <Badge tone="outline" icon="description">
                        {citation.label}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}

        {mutation.isPending && (
          <p role="status" className="flex items-center gap-2 text-body-sm text-primary">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            {t("thinking")}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="border-t border-outline-variant/70 bg-surface-container-low px-5 py-4"
      >
        <div className="relative">
          <label htmlFor="explain-question" className="sr-only">
            {t("placeholder")}
          </label>
          <input
            id="explain-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("placeholder")}
            aria-invalid={tooLong || undefined}
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest ps-4 pe-12 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none aria-[invalid=true]:border-error"
          />
          <button
            type="submit"
            aria-label={t("send")}
            disabled={!question.trim() || tooLong || mutation.isPending}
            className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-primary text-on-primary transition-opacity hover:bg-primary/90 disabled:opacity-40"
          >
            <Icon name="arrow_upward" size={18} />
          </button>
        </div>
        <p
          className={cn(
            "mt-2 text-center text-body-sm",
            tooLong ? "text-error" : "text-on-surface-variant",
          )}
        >
          {tooLong ? t("tooLong", { max: EXPLAIN_QUESTION_MAX }) : t("disclaimer")}
        </p>
      </form>
    </section>
  );
}
