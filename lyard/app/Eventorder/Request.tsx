"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type CommentForm = { comment: string };

export function Request() {
  const { comment, setComment } = useEventOrder();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<CommentForm>({ defaultValues: { comment: comment ?? "" } });

  // NOTE: your original had onChange={(e) => e.target.value} on the input.
  // That replaces register()'s own onChange, so react-hook-form never sees
  // the typed value. Syncing with watch() is the safe way to share it.
  useEffect(() => {
    const subscription = watch((values) => setComment(values.comment ?? ""));
    return () => subscription.unsubscribe();
  }, [watch, setComment]);

  return (
    <form id="comment-form" className={styles.section} onSubmit={(e) => e.preventDefault()}>
      <label className={styles.field}>
        <span>Comment</span>
        <input
          {...register("comment")}
          placeholder="Leave a comment"
          aria-invalid={!!errors.comment}
        />
      </label>
    </form>
  );
}

export default Request;