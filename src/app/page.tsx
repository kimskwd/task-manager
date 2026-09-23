"use client";

import { FormEvent, useEffect, useState } from "react";
import { getDueDateLabel, getRemainingDays } from "../lib/due-date";

type Task = {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

type TaskFilter = "all" | "active" | "completed" | "dueSoon";
type SortOrder = "ascending" | "descending";

const STORAGE_KEY = "student-task-manager:tasks";

function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === "string" &&
    typeof task.subject === "string" &&
    typeof task.title === "string" &&
    typeof task.dueDate === "string" &&
    typeof task.completed === "boolean"
  );
}

function parseStoredTasks(value: string | null): Task[] | null {
  if (value === null) {
    return [];
  }

  try {
    const parsedTasks: unknown = JSON.parse(value);

    if (!Array.isArray(parsedTasks)) {
      return null;
    }

    return parsedTasks.filter(isTask);
  } catch {
    return null;
  }
}

function isDueSoonTask(task: Task, today: Date): boolean {
  const remainingDays = getRemainingDays(task.dueDate, today);

  return (
    !task.completed &&
    remainingDays !== null &&
    remainingDays >= 0 &&
    remainingDays <= 3
  );
}

function isSortOrder(value: string): value is SortOrder {
  return value === "ascending" || value === "descending";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ascending");

  useEffect(() => {
    let loadedTasks: Task[] = [];
    let canPersistTasks = false;
    let hasAppliedInitialTasks = false;

    try {
      const parsedTasks = parseStoredTasks(window.localStorage.getItem(STORAGE_KEY));

      if (parsedTasks !== null) {
        loadedTasks = parsedTasks;
        canPersistTasks = true;
      }
    } catch {
      canPersistTasks = false;
    }

    const loadTimer = window.setTimeout(() => {
      setTasks(loadedTasks);
      setHasLoadedTasks(true);
      setIsStorageAvailable(canPersistTasks);
      hasAppliedInitialTasks = true;
    }, 0);

    function handleStorageChange(event: StorageEvent) {
      if (
        event.storageArea !== window.localStorage ||
        (event.key !== STORAGE_KEY && event.key !== null)
      ) {
        return;
      }

      const updatedTasks = parseStoredTasks(event.newValue);

      if (updatedTasks === null) {
        return;
      }

      if (hasAppliedInitialTasks) {
        setTasks(updatedTasks);
        setIsStorageAvailable(true);
        return;
      }

      loadedTasks = updatedTasks;
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.clearTimeout(loadTimer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedTasks || !isStorageAvailable) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // 저장 공간 부족이나 브라우저 설정으로 인한 저장 실패는 화면 동작에 영향을 주지 않는다.
    }
  }, [hasLoadedTasks, isStorageAvailable, tasks]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 1, 0);
    const refreshTimer = window.setTimeout(
      () => setCurrentDate(new Date()),
      nextMidnight.getTime() - now.getTime(),
    );

    return () => window.clearTimeout(refreshTimer);
  }, [currentDate]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject.trim() || !title.trim() || !dueDate) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      title: title.trim(),
      dueDate,
      completed: false,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setSubject("");
    setTitle("");
    setDueDate("");
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id);
    setEditingSubject(task.subject);
    setEditingTitle(task.title);
    setEditingDueDate(task.dueDate);
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setEditingSubject("");
    setEditingTitle("");
    setEditingDueDate("");
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      editingTaskId === null ||
      !editingSubject.trim() ||
      !editingTitle.trim() ||
      !editingDueDate
    ) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              subject: editingSubject.trim(),
              title: editingTitle.trim(),
              dueDate: editingDueDate,
            }
          : task,
      ),
    );
    cancelEditingTask();
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    if (editingTaskId === taskId) {
      cancelEditingTask();
    }
  }

  const completedTasks = tasks.filter((task) => task.completed).length;
  const dueSoonTasks = tasks.filter((task) => isDueSoonTask(task, currentDate)).length;
  const visibleTasks = tasks
    .filter((task) => {
      if (filter === "active") {
        return !task.completed;
      }

      if (filter === "completed") {
        return task.completed;
      }

      if (filter === "dueSoon") {
        return isDueSoonTask(task, currentDate);
      }

      return true;
    })
    .sort((firstTask, secondTask) => {
      const firstDays = getRemainingDays(firstTask.dueDate, currentDate);
      const secondDays = getRemainingDays(secondTask.dueDate, currentDate);

      if (firstDays === null && secondDays === null) {
        return 0;
      }

      if (firstDays === null) {
        return 1;
      }

      if (secondDays === null) {
        return -1;
      }

      return sortOrder === "ascending"
        ? firstDays - secondDays
        : secondDays - firstDays;
    });

  return (
    <main>
      <header className="page-header">
        <h1>과제 관리</h1>
        <p>해야 할 일을 한곳에서 정리하세요.</p>
      </header>

      <section className="summary-grid" aria-label="과제 현황 요약">
        <article className="summary-card">
          <span>전체 과제</span>
          <strong>{hasLoadedTasks ? tasks.length : "—"}</strong>
        </article>
        <article className="summary-card">
          <span>완료</span>
          <strong>{hasLoadedTasks ? completedTasks : "—"}</strong>
        </article>
        <article className="summary-card">
          <span>진행중</span>
          <strong>{hasLoadedTasks ? tasks.length - completedTasks : "—"}</strong>
        </article>
        <article className="summary-card summary-card-alert">
          <span>마감 임박</span>
          <strong>{hasLoadedTasks ? dueSoonTasks : "—"}</strong>
        </article>
      </section>

      <form className="task-form" onSubmit={addTask}>
        <label className="form-field">
          과목명
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="예: 웹 프로그래밍"
            required
          />
        </label>
        <label className="form-field">
          과제명
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 개인 홈페이지 만들기"
            required
          />
        </label>
        <label className="form-field">
          마감일
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
          />
        </label>
        <button className="add-button" type="submit">
          과제 추가
        </button>
      </form>

      <section className="task-section" aria-labelledby="task-list-heading">
        <div className="task-list-header">
          <h2 id="task-list-heading">과제 목록</h2>
          <div className="task-toolbar">
            <div className="filter-group" aria-label="과제 필터">
              <button
                className={`filter-button${filter === "all" ? " active" : ""}`}
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                전체
              </button>
              <button
                className={`filter-button${filter === "active" ? " active" : ""}`}
                type="button"
                aria-pressed={filter === "active"}
                onClick={() => setFilter("active")}
              >
                진행 중
              </button>
              <button
                className={`filter-button${filter === "completed" ? " active" : ""}`}
                type="button"
                aria-pressed={filter === "completed"}
                onClick={() => setFilter("completed")}
              >
                완료
              </button>
              <button
                className={`filter-button${filter === "dueSoon" ? " active" : ""}`}
                type="button"
                aria-pressed={filter === "dueSoon"}
                onClick={() => setFilter("dueSoon")}
              >
                마감 임박
              </button>
            </div>
            <label className="sort-control">
              <span>정렬</span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  if (isSortOrder(event.target.value)) {
                    setSortOrder(event.target.value);
                  }
                }}
              >
                <option value="ascending">마감일 빠른 순</option>
                <option value="descending">마감일 늦은 순</option>
              </select>
            </label>
          </div>
        </div>
        {!hasLoadedTasks ? (
          <p>과제를 불러오는 중입니다.</p>
        ) : tasks.length === 0 ? (
          <p>등록된 과제가 없습니다.</p>
        ) : visibleTasks.length === 0 ? (
          <p>선택한 조건에 맞는 과제가 없습니다.</p>
        ) : (
          <ul className="task-list">
            {visibleTasks.map((task) => {
              const isDueSoon = isDueSoonTask(task, currentDate);
              const isEditing = editingTaskId === task.id;

              return (
                <li
                  key={task.id}
                  className={`task-card${isDueSoon ? " due-soon" : ""}`}
                >
                  {isEditing ? (
                    <form className="edit-task-form" onSubmit={saveTask}>
                      <label className="form-field">
                        과목명
                        <input
                          value={editingSubject}
                          onChange={(event) => setEditingSubject(event.target.value)}
                          required
                        />
                      </label>
                      <label className="form-field">
                        과제명
                        <input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          required
                        />
                      </label>
                      <label className="form-field">
                        마감일
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(event) => setEditingDueDate(event.target.value)}
                          required
                        />
                      </label>
                      <div className="task-actions">
                        <button className="save-button" type="submit">
                          저장
                        </button>
                        <button className="cancel-button" type="button" onClick={cancelEditingTask}>
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <label className="task-content">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span className={`task-details${task.completed ? " completed" : ""}`}>
                          {task.subject} — {task.title} (마감일: {task.dueDate},{" "}
                          <strong className={isDueSoon ? "due-soon-label" : undefined}>
                            {getDueDateLabel(task.dueDate, currentDate)}
                          </strong>
                          )
                        </span>
                      </label>
                      <div className="task-actions">
                        <button
                          className="edit-button"
                          type="button"
                          onClick={() => startEditingTask(task)}
                        >
                          수정
                        </button>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => deleteTask(task.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
