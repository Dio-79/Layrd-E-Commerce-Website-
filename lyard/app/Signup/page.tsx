import { Formik, Form, Field, ErrorMessage } from 'formik';


export default function SignForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      onSubmit={(values) => {
        console.log('Login values:', values);
      }}
    >
      <Form>
        <div>
            <label htmlFor="Name">Name</label>
            <Field id="name" name="Name" type="Name"/>
           <ErrorMessage name="Name" component="div" />

        </div>
        <div>
          <label htmlFor="email">Email</label>
          <Field id="email" name="email" type="email" />
          <ErrorMessage name="email" component="div" />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <Field id="password" name="password" type="password" />
          <ErrorMessage name="password" component="div" />
        </div>

        <button type="submit">SignForm</button>
      </Form>
    </Formik>
  );
}