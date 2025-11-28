import * as React from "react";
import { IDictionary } from "../domain/IDictionary";
import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { TodoItemComponent, TodoItemDisplayPreferences } from "./TodoItemComponent";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ILogger } from "../domain/ILogger";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";

function getPriorityValue(todo: TodoItem<TFile>): number {
  if (!todo.attributes || !todo.attributes["priority"]) {
    return 0
  }
  const priority = todo.attributes["priority"] as string
  const priorities: IDictionary<number> = {
    critical: 10,
    high: 9,
    medium: 5,
    low: 3,
    lowest: -1,
  }
  return priorities[priority] || 0
};

function getStatusValue(todo: TodoItem<TFile>): number {
  switch (todo.status) {
    case TodoStatus.Canceled:
      return 0
    case TodoStatus.Complete:
      return 1
    default:
      return 10
  }
}

function sortTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
  if (!todos) {
    return []
  }
  return [...todos].sort((a, b) => {
    // 1. Sort by Status first
    const statusDiff = getStatusValue(b) - getStatusValue(a);
    if (statusDiff) {
      return statusDiff
    }

    // 2. Then sort by Priority
    const priorityDiff = getPriorityValue(b) - getPriorityValue(a);
    if (priorityDiff) {
      return priorityDiff
    }

    // 3. Finally sort by file appearance order (file path + line number)
    // 3a. Compare file paths (with safety checks)
    const filePathA = a.file?.path || '';
    const filePathB = b.file?.path || '';
    const fileCompare = filePathA.localeCompare(filePathB);
    if (fileCompare !== 0) {
      return fileCompare;
    }

    // 3b. Within same file, sort by line number
    const lineA = a.line ?? Number.MAX_SAFE_INTEGER;  // Items without line numbers go last
    const lineB = b.line ?? Number.MAX_SAFE_INTEGER;
    return lineA - lineB;
  })
}

export interface TodoListComponentDeps {
  logger: ILogger,
  app: App, 
  settings: ProletarianWizardSettings,
}

export interface TodoListComponentProps {
  todos: TodoItem<TFile>[], 
  deps: TodoListComponentDeps,
  playSound?: PwEvent<Sound>,
  dontCrossCompleted?: boolean,
  displayPreferences: TodoItemDisplayPreferences,
}

export function TodoListComponent({todos, deps, playSound, dontCrossCompleted, displayPreferences}: TodoListComponentProps) {
  const sortedTodos = sortTodos(todos);
  return <div>
    {sortedTodos.map(todo => <TodoItemComponent 
      todo={todo} 
      key={getTodoId(todo)} 
      deps={deps} 
      playSound={playSound} 
      displayPreferences={displayPreferences}
      dontCrossCompleted={dontCrossCompleted}/>)}
  </div>;
}