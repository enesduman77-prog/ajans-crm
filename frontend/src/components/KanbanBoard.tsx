import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Calendar, Building2, User } from 'lucide-react';
import type { TaskResponse } from '../api/staff';

interface KanbanBoardProps {
    tasks: TaskResponse[];
    onStatusChange: (taskId: string, newStatus: string) => void;
}

const columns = [
    { id: 'TODO', label: 'Yapılacak', color: 'border-zinc-500', bgColor: 'bg-zinc-500/10', textColor: 'text-zinc-400' },
    { id: 'IN_PROGRESS', label: 'Devam Eden', color: 'border-blue-500', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400' },
    { id: 'DONE', label: 'Tamamlanan', color: 'border-emerald-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
];

const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400',
    HIGH: 'bg-orange-500/20 text-orange-400',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    LOW: 'bg-zinc-500/20 text-zinc-400',
};

const priorityLabels: Record<string, string> = {
    CRITICAL: 'Kritik',
    HIGH: 'Yüksek',
    MEDIUM: 'Orta',
    LOW: 'Düşük',
};

function TaskCard({ task, isDragging = false }: { task: TaskResponse; isDragging?: boolean }) {
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== 'DONE';
    return (
        <div className={`p-3 bg-[#111113] border border-white/[0.06] rounded-xl transition-all ${isDragging ? 'shadow-2xl shadow-black/50 rotate-2 scale-105' : 'hover:border-white/[0.1]'
            }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-[13px] font-medium text-white leading-snug flex-1">{task.title}</h4>
                {task.priority && (
                    <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 shrink-0 ${priorityColors[task.priority] || ''}`}>
                        {priorityLabels[task.priority] || task.priority}
                    </span>
                )}
            </div>
            {task.description && (
                <p className="text-[11px] text-zinc-600 line-clamp-2 mb-2">{task.description}</p>
            )}
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                {task.companyName && (
                    <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {task.companyName}
                    </span>
                )}
                {task.assignedToName && (
                    <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignedToName}
                    </span>
                )}
                {task.endDate && (
                    <span className={`flex items-center gap-1 ml-auto ${isOverdue ? 'text-red-400' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(task.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>
        </div>
    );
}

function SortableTaskCard({ task }: { task: TaskResponse }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { status: task.status },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <TaskCard task={task} />
        </div>
    );
}

function Column({ id, label, color, bgColor, textColor, tasks }: {
    id: string; label: string; color: string; bgColor: string; textColor: string; tasks: TaskResponse[];
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex-1 min-w-[260px]">
            <div className={`flex items-center gap-2 mb-3 px-1`}>
                <div className={`w-2 h-2 rounded-full ${color.replace('border-', 'bg-')}`} />
                <h3 className={`text-[13px] font-bold ${textColor}`}>{label}</h3>
                <span className="text-[11px] text-zinc-600 bg-white/[0.04] rounded-full px-2 py-0.5">{tasks.length}</span>
            </div>

            <div
                ref={setNodeRef}
                className={`space-y-2 min-h-[200px] p-2 rounded-xl border border-dashed transition-colors ${isOver ? `${bgColor} border-white/[0.12]` : 'border-transparent'
                    }`}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-[120px] text-zinc-700 text-[12px]">
                        Görev yok
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const grouped = useMemo(() => {
        const map: Record<string, TaskResponse[]> = {};
        columns.forEach(c => { map[c.id] = []; });
        tasks.forEach(t => {
            const status = columns.find(c => c.id === t.status) ? t.status : 'TODO';
            map[status].push(t);
        });
        return map;
    }, [tasks]);

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Determine target column
        let targetStatus: string | null = null;

        // Check if dropped on a column
        if (columns.find(c => c.id === over.id)) {
            targetStatus = over.id as string;
        } else {
            // Dropped on another task — find which column that task is in
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) targetStatus = overTask.status;
        }

        if (targetStatus && targetStatus !== task.status) {
            onStatusChange(taskId, targetStatus);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map(col => (
                    <Column key={col.id} {...col} tasks={grouped[col.id]} />
                ))}
            </div>
            <DragOverlay>
                {activeTask && <TaskCard task={activeTask} isDragging />}
            </DragOverlay>
        </DndContext>
    );
}
