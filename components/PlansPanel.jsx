"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/contexts/AppContext"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export default function PlansPanel({ className = "" }) {
  const { plans, addPlan, removePlan, addTaskToPlan, toggleTaskInPlan, removeTaskFromPlan, updateTaskInPlan } = useAppContext()
  const { toast } = useToast()
  const [newPlanName, setNewPlanName] = useState("")
  const [taskInputs, setTaskInputs] = useState({})
  const [dueInputs, setDueInputs] = useState({})

  const handleAddPlan = () => {
    const id = addPlan(newPlanName || "My Plan")
    setNewPlanName("")
    return id
  }

  const handleAddTask = (planId) => {
    const title = (taskInputs[planId] || "").trim()
    if (!title) return
    const taskId = addTaskToPlan(planId, title)
    const due = dueInputs[planId]
    if (due) {
      updateTaskInPlan(planId, taskId, { dueDate: new Date(due).toISOString() })
    }
    setTaskInputs(prev => ({ ...prev, [planId]: "" }))
    setDueInputs(prev => ({ ...prev, [planId]: "" }))
  }

  // simple reminder poller
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      plans.forEach(plan => {
        plan.tasks.forEach(task => {
          if (!task.completed && task.dueDate) {
            const due = new Date(task.dueDate).getTime()
            if (due <= now) {
              toast({
                title: "Task due",
                description: `${task.title} is due now`,
              })
              // push remindAt forward to avoid spamming until user updates
              updateTaskInPlan(plan.id, task.id, { dueDate: new Date(now + 60*60*1000).toISOString() })
            }
          }
        })
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [plans])

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Action Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New plan name"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
            />
            <Button onClick={handleAddPlan}>Add Plan</Button>
          </div>

          {plans.length === 0 && (
            <div className="text-sm text-gray-500">No plans yet. Create one to track tasks.</div>
          )}

          <div className="space-y-6">
            {plans.map(plan => (
              <Card key={plan.id}>
                <CardHeader className="flex items-center justify-between flex-row">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Button variant="destructive" size="sm" onClick={() => removePlan(plan.id)}>Delete</Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a task"
                      value={taskInputs[plan.id] || ""}
                      onChange={(e) => setTaskInputs(prev => ({ ...prev, [plan.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(plan.id) }}
                    />
                    <Input
                      type="datetime-local"
                      value={dueInputs[plan.id] || ""}
                      onChange={(e) => setDueInputs(prev => ({ ...prev, [plan.id]: e.target.value }))}
                      className="min-w-[10rem]"
                    />
                    <Button onClick={() => handleAddTask(plan.id)}>Add</Button>
                  </div>

                  {plan.tasks.length === 0 ? (
                    <div className="text-sm text-gray-500">No tasks yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {plan.tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                          <label className="flex items-center gap-3">
                            <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskInPlan(plan.id, task.id)} />
                            <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleString()}</span>
                            )}
                            <Button variant="outline" size="sm" onClick={() => updateTaskInPlan(plan.id, task.id, { dueDate: new Date(Date.now() + 24*60*60*1000).toISOString() })}>Snooze +1d</Button>
                            <Button variant="ghost" size="sm" onClick={() => removeTaskFromPlan(plan.id, task.id)}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


