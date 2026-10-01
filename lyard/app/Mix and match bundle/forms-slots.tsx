import { useForm } from 'react-hook-form';
import React, { useState } from 'react';


const size =[size ,setsize]= useState<>

export default function SelectionForms(){

    const { register, handleSubmit, formState: { errors } } = useForm()
     const onSubmit = (data: null) => console.log(data);

     return(
        <form>
     <select>
   <label>select a flavor per slot </label>
     <option value=""></option>
     <option value=""></option>
    <option value=""></option>

     </select>
     <button>


     </button>
</form>
     )

}