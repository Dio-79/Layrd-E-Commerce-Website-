"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type CommentForm = { comment: string };
 
type EventOrderContextValue = {
  comment: string;
  setComment: (value: string) => void;
  registerValidator?: (field: string, callback: () => boolean | Promise<boolean>) => void;
};

export function Request() {
  const eventOrder = useEventOrder() as EventOrderContextValue;
  const { comment, setComment } = eventOrder;
  const registerValidator = eventOrder.registerValidator ?? (() => undefined);
 
  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CommentForm>({ defaultValues: { comment } });
 
  useEffect(() => {
    const subscription = watch((values) => setComment(values.comment ?? ""));
    return () => subscription.unsubscribe();
  }, [watch, setComment]);
 
  useEffect(() => {
    if (typeof registerValidator === "function") {
      registerValidator("comment", () => trigger());
    }
  }, [registerValidator, trigger]);
 
  return (
    <form id="comment-form" onSubmit={(e) => e.preventDefault()}>
      <textarea
        {...register("comment")}
        className={styles.comment}
        placeholder="Ask any question here..."
        aria-label="Questions or comments"
        aria-invalid={!!errors.comment}
      />
    </form>
  );
}
 
export default Request;
 