import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Select } from "./ui/Select";
import { DatePicker } from "./ui/DatePicker";
import { TimePicker } from "./ui/TimePicker";

const DEFAULT_FORM = {
  title: "",
  description: "",
  category: "Work",
  priority: "medium",
  dueDate: "",
  dueTime: "",
};

export default function TaskForm({ open, onClose, onSubmit, task }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate || "",
        dueTime: task.dueTime || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [task, open]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (form.dueTime && !form.dueDate) errs.dueDate = "A due date is required when setting a time";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      dueDate: form.dueDate || null,
      dueTime: form.dueTime || null,
    });
    onClose();
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Clearing the date also clears the time
  const handleDueDateChange = (val) => {
    setForm((f) => ({ ...f, dueDate: val, dueTime: val ? f.dueTime : "" }));
    if (errors.dueDate) setErrors((e) => ({ ...e, dueDate: undefined }));
  };

  const clearDue = () => setForm((f) => ({ ...f, dueDate: "", dueTime: "" }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="What needs to be done?"
              value={form.title}
              onChange={set("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Description
            </label>
            <Textarea
              placeholder="Add details (optional)"
              value={form.description}
              onChange={set("description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Category
              </label>
              <Select value={form.category} onChange={set("category")}>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Personal">Personal</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Priority
              </label>
              <Select value={form.priority} onChange={set("priority")}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Due Date &amp; Time
                <span className="text-xs text-muted-foreground font-normal ml-1">(optional)</span>
              </label>
              {(form.dueDate || form.dueTime) && (
                <button
                  type="button"
                  onClick={clearDue}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                value={form.dueDate}
                onChange={handleDueDateChange}
                placeholder="Pick a date"
              />
              <TimePicker
                value={form.dueTime}
                onChange={(val) => setForm((f) => ({ ...f, dueTime: val }))}
                disabled={!form.dueDate}
                placeholder="Pick a time"
              />
            </div>
            {errors.dueDate && (
              <p className="text-xs text-destructive mt-1">{errors.dueDate}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {task ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
