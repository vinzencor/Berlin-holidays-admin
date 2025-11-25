import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Mail, Hotel } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        toast.success('Login successful! Welcome to Berlin Holidays Admin Panel');
        navigate('/admin');
      } else {
        toast.error('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3e8] via-white to-[#c49d71] p-4">
      <Card className="w-full max-w-md shadow-2xl border border-[#c49d71]">
        <CardHeader className="space-y-3 text-center">

          {/* LOGO AREA */}
          <div className="mx-auto w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md">
            <img 
              src="/public/images/Berlin_logo.png"
              alt="Berlin Holidays Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* TITLE */}
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#006938] to-[#c49d71] bg-clip-text text-transparent">
            Berlin Holidays
          </CardTitle>
          <CardDescription className="text-base text-[#006938] font-medium">
            Admin Panel Login
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#006938]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#006938]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="berlinholidays@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 border-[#c49d71] focus-visible:ring-[#c49d71]"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#006938]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#006938]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 border-[#c49d71] focus-visible:ring-[#c49d71]"
                />
              </div>
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              className="w-full bg-[#006938] hover:bg-[#00552d] text-white font-semibold py-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* DEMO CREDS */}
            <div className="mt-6 p-4 bg-[#f1e8dd] rounded-lg border border-[#c49d71]">
              <p className="text-xs text-[#006938] font-medium mb-2">
                Super Admin Credentials:
              </p>
              <div className="space-y-1">
                <p className="text-xs text-[#006938]">Email: berlinholidays@gmail.com</p>
                <p className="text-xs text-[#006938]">Password: 123456</p>
              </div>
              <div className="mt-3 pt-3 border-t border-[#c49d71] space-y-1">
                <p className="text-xs text-[#006938]">Email: rahulpradeepan77@gmail.com</p>
                <p className="text-xs text-[#006938]">Password: 987654321</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
