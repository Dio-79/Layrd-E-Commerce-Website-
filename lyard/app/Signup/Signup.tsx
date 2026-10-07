

'use client';
import { SignupForm as submitSignupForm} from './SignupApi';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function SignupForm() {
  return (
    <Formik
      initialValues={{ username:'',email: '', password: '' }}
      validationSchema={schema}
      onSubmit={(values) => {
        console.log('Login values:', values);
        submitSignupForm();
      }}
    >
      {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
        <Form onSubmit={handleSubmit}>
            <div>
            <label htmlFor="username">Name</label>
            <Field id="username" username="username" type="username" />
            <ErrorMessage name="username" component="div" />
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

          <button type="submit">Login</button>

          <div>
            <button type="submit">Wholesales</button>
          </div>

          <button type="button">Browse Shop</button>

          <div>
            <input
              placeholder="Name"
              value={values.username}
              onChange={handleChange('username')}
              onBlur={handleBlur('username')}
              type="username"
            />
            {errors.username && touched.username ? <div>{errors.username}</div> : null}
          </div>

          <div>
            <input
              placeholder="Email"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              type="email"
            />
            {errors.email && touched.email ? <div>{errors.email}</div> : null}
          </div>
          <input
          
            placeholder="Password"
              value={values.password}
              onChange={handleChange('Password')}
              onBlur={handleBlur('Password')}
              type="Password"
          
          />
         {errors.password && touched.password ? <div>{errors.password}</div> : null}

        </Form>
      )}
    </Formik>
  );
}