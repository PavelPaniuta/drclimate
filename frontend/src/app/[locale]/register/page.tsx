import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
