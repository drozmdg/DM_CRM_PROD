import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerNotesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, Trash2, Save, X, FileText, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CustomerNote } from "@shared/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerNotesProps {
  customerId: string;
}

export default function CustomerNotes({ customerId }: CustomerNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['customerNotes', customerId],
    queryFn: () => customerNotesApi.getAll(customerId),
    enabled: !!customerId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (content: string) => customerNotesApi.create(customerId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotes', customerId] });
      setIsAddingNote(false);
      setNoteContent("");
      toast({
        title: "Note added",
        description: "The note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      customerNotesApi.update(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotes', customerId] });
      setEditingNoteId(null);
      setNoteContent("");
      toast({
        title: "Note updated",
        description: "The note has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotes', customerId] });
      setDeleteNoteId(null);
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (editingNoteId) {
      updateMutation.mutate({ id: editingNoteId, content: noteContent });
    } else {
      createMutation.mutate(noteContent);
    }
  };

  const handleEditNote = (note: CustomerNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.noteContent);
    setIsAddingNote(false);
  };

  const handleCancel = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
    setNoteContent("");
  };

  const handleDeleteNote = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customer Notes
          </CardTitle>
          {!isAddingNote && !editingNoteId && (
            <Button
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Note Form */}
        {(isAddingNote || editingNoteId) && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <Textarea
              placeholder="Enter your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || createMutation.isPending || updateMutation.isPending}
                className="gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingNoteId ? "Update" : "Save"} Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add a note to keep track of important information</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {notes.map((note: CustomerNote) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${
                    editingNoteId === note.id ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="whitespace-pre-wrap text-sm">{note.noteContent}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </span>
                        {note.updatedAt !== note.createdAt && (
                          <span className="italic">
                            (edited {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })})
                          </span>
                        )}
                      </div>
                    </div>
                    {editingNoteId !== note.id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditNote(note)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteNoteId(note.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}