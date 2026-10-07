import { useForm } from 'react-hook-form';


 type timestamp ={Starttime:string ; number:string; type:string; Flavor:string }


export default function SelectionForm(){
 const { register, handleSubmit, formState: { errors } } = useForm<timestamp>({mode:'onBlur'});

 const onSubmit = (data: timestamp) => console.log(data);
 
 const Today = new Date().toISOString().split("T")[0];

     return (
         <form onSubmit={handleSubmit(onSubmit)}>
             <p>Quality</p>
             <input
                 {...register('number')}
                 placeholder="100"
             />
             {errors.number && <span>This field is required</span>}

      <input
        type="date"
        {...register('Starttime', {
          required: 'Enter date of pick up',
          validate: (v) => v >= Today || 'Pick-up date cannot be in the past'
        })}
      />
      {errors.Starttime && <span>{errors.Starttime.message}</span>}

<p>Event Order</p>
             <input
                 {...register('type')}
                 placeholder="Wedding"
             />
             {errors.type && <span>This field is required</span>} 
            
            
                 </form>
  );
}