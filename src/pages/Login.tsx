import { LoginForm } from "@/components/login-form";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  return <LoginForm onLogin={onLogin} />;
};

export default Login;