import { Formik, Form, Field, ErrorMessage } from 'formik';

export default function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      onSubmit={(values) => {
        console.log('Login values:', values);
      }}
    >
      <Form>
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

        <button type="submit">Login</button>

        <div>
        <button type='submit'>Wholesales</button>
        </div>
        <button type='submit'>browse shop</button>

      </Form>
    </Formik>

  );
}