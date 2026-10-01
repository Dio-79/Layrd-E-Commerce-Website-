import { useForm } from 'react-hook-form';
import React from 'react';

export default function SelectionForms() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: Record<string, unknown>) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="flavor-slot">select a flavor per slot</label>
      <select
        id="flavor-slot"
        defaultValue=""
        {...register('flavorSlot', { required: 'Please select a flavor' })}
      >
        <option value="">Select</option>
        <option value="vanilla">Vanilla</option>
        <option value="chocolate">Chocolate</option>
        <option value="strawberry">Strawberry</option>
      </select>
      {errors.flavorSlot && <span>{String(errors.flavorSlot.message)}</span>}
      <button type="submit">Submit</button>
    </form>

    
  );
}