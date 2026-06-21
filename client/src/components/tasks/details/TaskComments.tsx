import React, { useState, useMemo } from "react";
import { Pin, Edit, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  userId: string;
  userName: string | null;
  userPhotoUrl?: string | null;
  content: string;
  category?: string;
  isPinned: boolean;
  reactions?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  fullNameEnglish: string;
  employeeId: string;
}

interface TaskCommentsProps {
  comments: Comment[] | null;
  employees: Employee[];
  currentUser: { id: string; name?: string; photoUrl?: string } | null;
  onPostComment: (content: string, category: string) => void;
  onPinComment: (commentId: string, currentPinned: boolean) => void;
  onSaveCommentEdit: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleReaction: (commentId: string, emoji: string, reactionsStr: string) => void;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  comments,
  employees,
  currentUser,
  onPostComment,
  onPinComment,
  onSaveCommentEdit,
  onDeleteComment,
  onToggleReaction,
}) => {
  const [commentText, setCommentText] = useState("");
  const [commentCategory, setCommentCategory] = useState("general");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Mentions local states
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const filteredMentionEmployees = useMemo(() => {
    if (mentionSearch === null) return [];
    const query = mentionSearch.toLowerCase();
    return employees.filter(emp =>
      emp.fullNameEnglish.toLowerCase().includes(query)
    );
  }, [mentionSearch, employees]);

  const selectMention = (name: string) => {
    if (mentionSearch === null) return;
    const textarea = document.getElementById("comment-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const textBefore = commentText.slice(0, start);
    const textAfter = commentText.slice(start);
    const lastIdx = textBefore.lastIndexOf("@");
    if (lastIdx !== -1) {
      const nextText = textBefore.slice(0, lastIdx) + "@" + name + " " + textAfter;
      setCommentText(nextText);
      setMentionSearch(null);
      setTimeout(() => {
        textarea.focus();
        const newPos = lastIdx + name.length + 2; // @ + name + space
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleCommentChange = (val: string, selectionStart: number) => {
    setCommentText(val);
    const textBeforeCaret = val.slice(0, selectionStart);
    const words = textBeforeCaret.split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      setMentionSearch(lastWord.slice(1));
      setMentionIndex(0);
    } else {
      setMentionSearch(null);
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onPostComment(commentText, commentCategory);
    setCommentText("");
    setCommentCategory("general");
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    onSaveCommentEdit(commentId, editingCommentText);
    setEditingCommentId(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handlePost} className="flex flex-col gap-2.5 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Category:</span>
          <div className="flex gap-1">
            {["general", "status", "blocker", "feedback"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCommentCategory(cat)}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all cursor-pointer",
                  commentCategory === cat
                    ? cat === "blocker" ? "bg-rose-500/10 border-rose-500 text-rose-600"
                      : cat === "status" ? "bg-blue-500/10 border-blue-500 text-blue-600"
                      : cat === "feedback" ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                      : "bg-primary/10 border-primary text-primary"
                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <Textarea
            id="comment-textarea"
            placeholder="Write collaborative updates/feedback... Use @Name to mention a colleague. Use Shift+Enter for new line."
            value={commentText}
            onChange={(e) => handleCommentChange(e.target.value, e.target.selectionStart)}
            className="text-xs min-h-[70px] resize-none bg-transparent"
            onKeyDown={(e) => {
              if (mentionSearch !== null && filteredMentionEmployees.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev + 1) % filteredMentionEmployees.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev - 1 + filteredMentionEmployees.length) % filteredMentionEmployees.length);
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  selectMention(filteredMentionEmployees[mentionIndex].fullNameEnglish);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionSearch(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost(e);
              }
            }}
          />
          {mentionSearch !== null && filteredMentionEmployees.length > 0 && (
            <div className="absolute left-0 bottom-full mb-1 z-50 w-60 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-1.5 space-y-0.5">
              {filteredMentionEmployees.map((emp, idx) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => selectMention(emp.fullNameEnglish)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                    idx === mentionIndex
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                  onMouseEnter={() => setMentionIndex(idx)}
                >
                  <span>{emp.fullNameEnglish}</span>
                  <span className="text-[10px] text-slate-400 font-normal">@{emp.employeeId}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs bg-primary">
            <Send className="h-3.5 w-3.5" /> Post Comment
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          [...comments]
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((comm) => {
              let reactionObj: Record<string, string[]> = {};
              try {
                reactionObj = JSON.parse(comm.reactions || "{}");
              } catch {
                reactionObj = {};
              }

              return (
                <div
                  key={comm.id}
                  className={cn(
                    "group p-3 rounded-lg border flex gap-2.5 items-start transition-all duration-300",
                    comm.isPinned
                      ? "bg-amber-500/5 dark:bg-amber-500/2 border-amber-300/60 dark:border-amber-900/40 shadow-sm"
                      : "bg-slate-50/20 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/50"
                  )}
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 overflow-hidden">
                    {comm.userPhotoUrl ? (
                      <img src={comm.userPhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      comm.userName?.[0] || "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{comm.userName}</span>
                        {comm.category && comm.category !== "general" && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-1 py-0 border-none font-bold uppercase",
                              comm.category === "blocker" ? "bg-rose-500/10 text-rose-500"
                                : comm.category === "status" ? "bg-blue-500/10 text-blue-500"
                                : "bg-emerald-500/10 text-emerald-500"
                            )}
                          >
                            {comm.category}
                          </Badge>
                        )}
                        {comm.isPinned && (
                          <span className="flex items-center text-amber-500 gap-0.5 text-[8px] font-bold uppercase">
                            <Pin className="w-2.5 h-2.5 fill-amber-500 rotate-45" /> Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(comm.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>

                    {editingCommentId === comm.id ? (
                      <div className="space-y-1.5 pt-1">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="text-xs min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="outline" className="text-[9px] h-6" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                          <Button size="xs" className="text-[9px] h-6 bg-primary" onClick={() => handleSaveEdit(comm.id)}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
                    )}

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-1 mt-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                      {["👍", "❤️", "🚀", "👀"].map((emoji) => {
                        const userList = reactionObj[emoji] || [];
                        const hasReacted = currentUser?.id ? userList.includes(currentUser.id) : false;
                        const count = userList.length;

                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(comm.id, emoji, comm.reactions || "{}")}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-all cursor-pointer",
                              hasReacted
                                ? "bg-primary/10 border-primary/20 text-primary font-bold"
                                : "border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-600"
                            )}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="text-[9px]">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons: Pin, Edit, Delete */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 shrink-0 transition-opacity ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPinComment(comm.id, comm.isPinned)}
                      className={cn(
                        "h-6 w-6 text-slate-400 hover:text-amber-500 hover:bg-transparent",
                        comm.isPinned && "text-amber-500"
                      )}
                      title={comm.isPinned ? "Unpin Comment" : "Pin Comment"}
                    >
                      <Pin className="h-3 w-3 rotate-45" />
                    </Button>
                    
                    {comm.userId === currentUser?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCommentId(comm.id);
                            setEditingCommentText(comm.content);
                          }}
                          className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-transparent"
                          title="Edit Comment"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteComment(comm.id)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-500 hover:bg-transparent"
                          title="Delete Comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="py-8 text-center text-slate-400 italic">No discussion logged. Start the conversation!</div>
        )}
      </div>
    </div>
  );
};
