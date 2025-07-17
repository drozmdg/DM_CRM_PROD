import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/components/auth/ProtectedRoute";
import { 
  Building, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Settings, 
  MessageSquare,
  Wrench,
  FileText,
  UserCheck,
  Package,
  LogOut,
  User,
  ChevronDown
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { hasRole } = usePermissions();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Viewer'] },
    { href: "/customers", label: "Customers", icon: Users, roles: ['Admin', 'Manager', 'Viewer'] },
    { href: "/contacts", label: "Contacts", icon: UserCheck, roles: ['Admin', 'Manager'] },
    { href: "/processes", label: "Processes", icon: Settings, roles: ['Admin', 'Manager', 'Viewer'] },
    { href: "/products", label: "Pharmaceutical Products", icon: Package, roles: ['Admin', 'Manager'] },
    { href: "/services", label: "Services", icon: Wrench, roles: ['Admin', 'Manager'] },
    { href: "/documents", label: "Documents", icon: FileText, roles: ['Admin', 'Manager', 'Viewer'] },
    { href: "/ai-chat", label: "AI Chat", icon: MessageSquare, roles: ['Admin', 'Manager', 'Viewer'] },
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
              const canAccess = !isAuthenticated || hasRole(item.roles as any);
              
              if (!canAccess) return null;
              
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
          {isAuthenticated && (
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell size={18} />
                <Badge className="absolute -top-1 -right-1 w-3 h-3 p-0 bg-accent text-xs"></Badge>
              </Button>
            </div>
          )}
          
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-neutral-700">{user.name}</div>
                    <div className="text-xs text-neutral-500">{user.role}</div>
                  </div>
                  <ChevronDown size={16} className="text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings size={16} />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center space-x-2 text-red-600 focus:text-red-600" 
                  onClick={() => logout()}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  DM
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-700 hidden md:block">
                Sales Dashboard
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
