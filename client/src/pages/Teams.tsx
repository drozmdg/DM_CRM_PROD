import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Edit, UserPlus, Building } from "lucide-react";
import TeamModal from "@/components/TeamModal";

export default function Teams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const filteredTeams = teams?.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.financeCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewTeam = (team: any) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Teams</h2>
          <p className="text-neutral-600">Manage your teams and track their finance codes for billing</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => {
            setSelectedTeam(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2" size={16} />
          Create Team
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <Input
                placeholder="Search teams by name or finance code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 truncate">{team.name}</h3>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {team.financeCode}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Finance Code:</span>
                  <code className="text-neutral-800 bg-neutral-100 px-2 py-1 rounded text-xs">
                    {team.financeCode}
                  </code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Created:</span>
                  <span className="text-neutral-800">
                    {team.createdAt && new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="flex items-center space-x-1">
                  <UserPlus size={14} className="text-neutral-400" />
                  <span className="text-xs text-neutral-600">Active Team</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewTeam(team)}
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No teams found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first team"}
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setSelectedTeam(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="mr-2" size={16} />
              Create Team
            </Button>
          </CardContent>
        </Card>
      )}

      <TeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        team={selectedTeam}
      />
    </div>
  );
}
