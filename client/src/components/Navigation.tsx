import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { 
  Building, 
  Search, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Settings, 
  UserPlus, 
  MessageSquare,
  LogOut
} from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/processes", label: "Processes", icon: Settings },
    { href: "/teams", label: "Teams", icon: UserPlus },
    { href: "/ai-chat", label: "AI Chat", icon: MessageSquare },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-semibold text-neutral-800">DM_CRM</h1>
          </div>
          
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10 font-medium"
                        : "text-neutral-600 hover:text-primary hover:bg-neutral-100"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
            <Input
              type="text"
              placeholder="Search customers, processes..."
              className="pl-10 pr-4 py-2 w-80"
            />
          </div>
          
          <div className="relative">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell size={18} />
              <Badge className="absolute -top-1 -right-1 w-3 h-3 p-0 bg-accent text-xs"></Badge>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="User profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-neutral-700 hidden md:block">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-neutral-600 hover:text-destructive"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
