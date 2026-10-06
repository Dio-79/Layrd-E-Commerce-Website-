'use client';

const wait =(ms:number )=> new Promise(resolve => setTimeout(resolve,ms))
async function Login(email:string,password:string){await wait(150);return{token:"abc123"}}


export async  function LoginForm() {
  return
}