import { useForm } from 'react-hook-form';



export function Request() {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = (data: Record<string, unknown>) => console.log(data);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input
                {...register('comment')}
                placeholder="Leave a comment"
                aria-invalid={!!errors.comment}
            />
        </form>
    );
}



