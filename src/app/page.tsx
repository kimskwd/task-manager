"use client";

import { type FormEvent, useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { getDueDateLabel, getRemainingDays } from "../lib/due-date";
import { createClient } from "../lib/supabase/client";

type Task = { id: string; subject: string; title: string; dueDate: string; completed: boolean };
type TaskRow = { id: string; subject: string; title: string; due_date: string; completed: boolean };
type Filter = "all" | "active" | "completed" | "dueSoon";
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const mapTask = (row: TaskRow): Task => ({ id: row.id, subject: row.subject, title: row.title, dueDate: row.due_date, completed: row.completed });

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(configured);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [signUp, setSignUp] = useState(false);
  const [subject, setSubject] = useState(""); const [title, setTitle] = useState(""); const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("all"); const [descending, setDescending] = useState(false); const [today, setToday] = useState(() => new Date());
  const [editing, setEditing] = useState<string | null>(null); const [editingSubject, setEditingSubject] = useState(""); const [editingTitle, setEditingTitle] = useState(""); const [editingDueDate, setEditingDueDate] = useState("");

  async function loadTasks() {
    const { data, error } = await createClient().from("tasks").select("id, subject, title, due_date, completed").order("due_date");
    if (error) setNotice(`과제를 불러오지 못했습니다: ${error.message}`); else setTasks((data as TaskRow[]).map(mapTask));
  }
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient(); let live = true;
    void supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => { if (!live) return; setUser(currentUser); if (currentUser) await loadTasks(); if (live) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setUser(nextSession?.user ?? null); if (!nextSession) setTasks([]); });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => { const next = new Date(); next.setHours(24, 0, 1, 0); const timer = window.setTimeout(() => setToday(new Date()), next.getTime() - Date.now()); return () => window.clearTimeout(timer); }, [today]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(""); const supabase = createClient();
    const result = signUp ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setNotice(`인증에 실패했습니다: ${result.error.message}`);
    if (signUp && !result.data.session) setNotice("가입 확인 이메일을 보냈습니다. 이메일의 링크를 눌러 계정을 활성화하세요."); else { setPassword(""); await loadTasks(); }
  }
  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user || !subject.trim() || !title.trim() || !dueDate) return;
    const { data, error } = await createClient().from("tasks").insert({ user_id: user.id, subject: subject.trim(), title: title.trim(), due_date: dueDate }).select("id, subject, title, due_date, completed").single();
    if (error) return setNotice(`과제를 저장하지 못했습니다: ${error.message}`);
    setTasks((current) => [...current, mapTask(data as TaskRow)]); setSubject(""); setTitle(""); setDueDate("");
  }
  async function updateTask(id: string, changes: Partial<Task>) {
    const updates = { ...(changes.subject !== undefined && { subject: changes.subject }), ...(changes.title !== undefined && { title: changes.title }), ...(changes.dueDate !== undefined && { due_date: changes.dueDate }), ...(changes.completed !== undefined && { completed: changes.completed }) };
    const { data, error } = await createClient().from("tasks").update(updates).eq("id", id).select("id, subject, title, due_date, completed").single();
    if (error) return setNotice(`과제를 수정하지 못했습니다: ${error.message}`);
    setTasks((current) => current.map((task) => task.id === id ? mapTask(data as TaskRow) : task));
  }
  async function removeTask(id: string) { const { error } = await createClient().from("tasks").delete().eq("id", id); if (error) return setNotice(`과제를 삭제하지 못했습니다: ${error.message}`); setTasks((current) => current.filter((task) => task.id !== id)); }
  const dueSoon = (task: Task) => { const days = getRemainingDays(task.dueDate, today); return !task.completed && days !== null && days >= 0 && days <= 3; };
  const shown = tasks.filter((task) => filter === "all" || (filter === "active" && !task.completed) || (filter === "completed" && task.completed) || (filter === "dueSoon" && dueSoon(task))).sort((a, b) => { const order = (getRemainingDays(a.dueDate, today) ?? Infinity) - (getRemainingDays(b.dueDate, today) ?? Infinity); return descending ? -order : order; });
  if (!configured) return <main><section className="auth-panel"><h1>Supabase 연결이 필요합니다</h1><p><code>.env.local</code>에 URL과 Publishable key를 설정하세요.</p><p><code>SUPABASE_SETUP.md</code>의 DB·권한 설정도 완료해야 합니다.</p></section></main>;
  if (loading) return <main><p>계정을 확인하는 중입니다.</p></main>;
  if (!user) return <main><section className="auth-panel"><h1>{signUp ? "계정 만들기" : "로그인"}</h1><p>나만의 과제 목록을 저장하고 어느 기기에서나 확인하세요.</p>{notice && <p className="status-message">{notice}</p>}<form className="auth-form" onSubmit={(event) => void authenticate(event)}><label className="form-field">이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="form-field">비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><button className="add-button" type="submit">{signUp ? "가입하기" : "로그인"}</button></form><button className="auth-switch" type="button" onClick={() => setSignUp((value) => !value)}>{signUp ? "이미 계정이 있나요? 로그인" : "처음이신가요? 계정 만들기"}</button></section></main>;
  const completed = tasks.filter((task) => task.completed).length;
  return <main><header className="page-header page-header-with-account"><div><h1>과제 관리</h1><p>로그인한 계정의 과제만 안전하게 저장됩니다.</p></div><div className="account-menu"><span>{user.email}</span><button className="sign-out-button" type="button" onClick={() => void createClient().auth.signOut()}>로그아웃</button></div></header>{notice && <p className="status-message">{notice}</p>}<section className="summary-grid">{[["전체 과제", tasks.length], ["완료", completed], ["진행중", tasks.length - completed], ["마감 임박", tasks.filter(dueSoon).length]].map(([name, count], index) => <article className={`summary-card${index === 3 ? " summary-card-alert" : ""}`} key={name as string}><span>{name}</span><strong>{count}</strong></article>)}</section><form className="task-form" onSubmit={(event) => void addTask(event)}><label className="form-field">과목명<input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label><label className="form-field">과제명<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label className="form-field">마감일<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label><button className="add-button" type="submit">과제 추가</button></form><section className="task-section"><div className="task-list-header"><h2>과제 목록</h2><div className="task-toolbar"><div className="filter-group">{([ ["all", "전체"], ["active", "진행 중"], ["completed", "완료"], ["dueSoon", "마감 임박"] ] as const).map(([value, name]) => <button key={value} className={`filter-button${filter === value ? " active" : ""}`} type="button" onClick={() => setFilter(value)}>{name}</button>)}</div><button className="filter-button" type="button" onClick={() => setDescending((value) => !value)}>마감일 {descending ? "늦은" : "빠른"} 순</button></div></div>{tasks.length === 0 ? <p>등록된 과제가 없습니다.</p> : shown.length === 0 ? <p>선택한 조건에 맞는 과제가 없습니다.</p> : <ul className="task-list">{shown.map((task) => <li className={`task-card${dueSoon(task) ? " due-soon" : ""}`} key={task.id}>{editing === task.id ? <form className="edit-task-form" onSubmit={(event) => { event.preventDefault(); void updateTask(task.id, { subject: editingSubject, title: editingTitle, dueDate: editingDueDate }); setEditing(null); }}><label className="form-field">과목명<input value={editingSubject} onChange={(event) => setEditingSubject(event.target.value)} required /></label><label className="form-field">과제명<input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} required /></label><label className="form-field">마감일<input type="date" value={editingDueDate} onChange={(event) => setEditingDueDate(event.target.value)} required /></label><div className="task-actions"><button className="save-button">저장</button><button className="cancel-button" type="button" onClick={() => setEditing(null)}>취소</button></div></form> : <><label className="task-content"><input type="checkbox" checked={task.completed} onChange={() => void updateTask(task.id, { completed: !task.completed })} /><span className={`task-details${task.completed ? " completed" : ""}`}>{task.subject} — {task.title} (마감일: {task.dueDate}, <strong className={dueSoon(task) ? "due-soon-label" : undefined}>{getDueDateLabel(task.dueDate, today)}</strong>)</span></label><div className="task-actions"><button className="edit-button" type="button" onClick={() => { setEditing(task.id); setEditingSubject(task.subject); setEditingTitle(task.title); setEditingDueDate(task.dueDate); }}>수정</button><button className="delete-button" type="button" onClick={() => void removeTask(task.id)}>삭제</button></div></>}</li>)}</ul>}</section></main>;
}
