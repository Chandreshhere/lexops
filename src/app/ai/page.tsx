"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import {
  clients,
  cases,
  invoices,
  communicationLogs,
  whatsappMessages,
  employees,
  tasks,
  upcomingHearings,
  expenses,
} from "@/services/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Show all clients with outstanding",
  "Rajesh Sharma cases",
  "List overdue invoices",
  "Tell me about Prakash Industries",
  "Active cases summary",
  "Vikram Builders payments",
  "Who is assigned to most cases?",
  "Upcoming hearings",
];

// ─── Response Engine ───────────────────────────────────────────────

function generateResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // ── Greetings ──
  if (q.match(/^(hi|hello|hey|namaste|good\s?morning|good\s?evening|good\s?afternoon|howdy|sup)/)) {
    const activeCases = cases.filter((c) => c.status === "Active").length;
    const pendingInv = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").length;
    const totalOutstanding = clients.reduce((s, c) => s + c.outstandingAmount, 0);
    return `Hello! I'm **LexOps AI**, your legal practice assistant.\n\nHere's today's snapshot:\n\n- **${clients.length}** Clients · **${cases.length}** Cases (${activeCases} active)\n- **${pendingInv}** Pending/Overdue invoices\n- **${formatCurrency(totalOutstanding)}** total outstanding\n- **${upcomingHearings.length}** upcoming hearings\n- **${tasks.filter((t) => t.status !== "Done").length}** pending tasks\n\nAsk me anything about clients, cases, payments, employees, hearings, or tasks.`;
  }

  // ── Help ──
  if (q.match(/help|what can you do|capabilities|features/)) {
    return `I can answer questions about:\n\n- **Clients** — "Tell me about Rajesh Sharma", "all clients", "clients with outstanding"\n- **Cases** — "active cases", "Rajesh Sharma cases", "LIT-2026-0142"\n- **Payments** — "overdue invoices", "Vikram Builders payments", "financial overview"\n- **Communication** — "Rajesh Sharma chats", "communication history"\n- **Employees** — "list employees", "who handles litigation"\n- **Hearings** — "upcoming hearings", "next hearing"\n- **Tasks** — "pending tasks", "urgent tasks"\n- **Expenses** — "show expenses", "office expenses"\n\nJust type naturally — I'll understand!`;
  }

  // ── Thank you ──
  if (q.match(/^(thank|thanks|dhanyavaad|shukriya|ok thank|okay thank)/)) {
    return "You're welcome! Let me know if you need anything else.";
  }

  // ── Bye ──
  if (q.match(/^(bye|goodbye|see you|good night)/)) {
    return "Goodbye! Have a great day. I'll be here whenever you need me.";
  }

  // ── Upcoming hearings ──
  if (q.match(/hearing|hearings|court.*date|next.*hearing/)) {
    if (upcomingHearings.length === 0) return "No upcoming hearings scheduled.";
    let r = `**Upcoming Hearings (${upcomingHearings.length}):**\n\n`;
    upcomingHearings
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((h) => {
        r += `- **${formatDate(h.date)}** — ${h.caseTitle}\n  Client: ${h.clientName} | Court: ${h.court}\n  Purpose: ${h.purpose} | Advocate: ${h.advocate}\n\n`;
      });
    return r;
  }

  // ── Tasks ──
  if (q.match(/task|tasks|to\s?do|pending.*task|urgent.*task/)) {
    const pending = tasks.filter((t) => t.status !== "Done");
    if (pending.length === 0) return "All tasks are completed! No pending tasks.";
    let r = `**Pending Tasks (${pending.length}):**\n\n`;
    pending
      .sort((a, b) => {
        const p: Record<string, number> = { Urgent: 0, High: 1, Normal: 2 };
        return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
      })
      .forEach((t) => {
        const priorityTag = t.priority === "Urgent" ? " 🔴" : t.priority === "High" ? " 🟡" : "";
        r += `- **${t.title}**${priorityTag}\n  Status: ${t.status} | Priority: ${t.priority} | Due: ${formatDate(t.dueDate)}\n  Assigned: ${t.assignedTo} | By: ${t.assignedBy}${t.caseId ? ` | Case: ${t.caseId}` : ""}\n\n`;
      });
    return r;
  }

  // ── Employees ──
  if (q.match(/employee|employees|staff|team|lawyer|advocate|who.*work|list.*team/)) {
    // Specific department search
    const deptMatch = q.match(/litigation|tncp|imc|ida|rera|revenue|financial|admin/i);
    const filtered = deptMatch
      ? employees.filter((e) => e.department.toLowerCase() === deptMatch[0].toLowerCase())
      : employees;

    if (filtered.length === 0) return "No employees found for that department.";

    const deptLabel = deptMatch ? ` — ${deptMatch[0].toUpperCase()} Department` : "";
    let r = `**Team Members (${filtered.length})${deptLabel}:**\n\n`;
    filtered.forEach((e) => {
      r += `- **${e.name}** — ${e.designation}\n  Dept: ${e.department} | Cases: ${e.activeCases} | Pending Tasks: ${e.pendingTasks}\n  Phone: ${e.phone} | Email: ${e.email}\n\n`;
    });
    return r;
  }

  // ── Expenses ──
  if (q.match(/expense|expenses|spending|office.*cost|disbursement/)) {
    if (expenses.length === 0) return "No expenses recorded.";
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    let r = `**Expenses (${expenses.length}) — Total: ${formatCurrency(total)}:**\n\n`;
    expenses.forEach((e) => {
      r += `- **${formatDate(e.date)}** — ${e.category}: ${e.description}\n  Amount: **${formatCurrency(e.amount)}** | Type: ${e.type} | Paid by: ${e.paidBy}${e.caseId ? ` | Case: ${e.caseId}` : ""}\n\n`;
    });
    return r;
  }

  // ── All clients with outstanding ──
  if (q.match(/(all|list|show).*client.*(outstanding|pending|due|owe)/) || q.match(/outstanding.*client/) || q.match(/client.*outstanding/) || q.match(/who.*owe/) || q.match(/pending.*payment.*client/)) {
    const withOutstanding = clients.filter((c) => c.outstandingAmount > 0).sort((a, b) => b.outstandingAmount - a.outstandingAmount);
    if (withOutstanding.length === 0) return "No clients have outstanding payments. All clear!";
    const total = withOutstanding.reduce((s, c) => s + c.outstandingAmount, 0);
    let r = `**Clients with Outstanding Payments (${withOutstanding.length}):**\n\n| Client | Outstanding | Total Paid | Active Cases |\n|---|---|---|---|\n`;
    withOutstanding.forEach((c) => {
      r += `| **${c.name}** | **${formatCurrency(c.outstandingAmount)}** | ${formatCurrency(c.totalPaid)} | ${c.activeCases} |\n`;
    });
    r += `\n**Total Outstanding: ${formatCurrency(total)}**`;
    return r;
  }

  // ── Overdue invoices ──
  if (q.match(/overdue.*(invoice|payment|bill)/) || q.match(/(invoice|payment|bill).*overdue/) || q.match(/late.*payment/)) {
    const overdue = invoices.filter((i) => i.status === "Overdue");
    if (overdue.length === 0) return "No overdue invoices. All payments are on track!";
    const total = overdue.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    let r = `**Overdue Invoices (${overdue.length}) — Total Due: ${formatCurrency(total)}:**\n\n`;
    overdue.forEach((inv) => {
      r += `- **${inv.invoiceNumber}** — ${inv.clientName}\n  Amount: **${formatCurrency(inv.amount)}** | Paid: ${formatCurrency(inv.paidAmount)} | Due: ${formatDate(inv.dueDate)}\n  ${inv.description}\n\n`;
    });
    return r;
  }

  // ── All invoices / pending invoices ──
  if (q.match(/(all|list|show|pending).*(invoice|invoices|bill)/)) {
    const target = q.includes("pending")
      ? invoices.filter((i) => i.status === "Pending" || i.status === "Overdue" || i.status === "Partially Paid")
      : invoices;
    const label = q.includes("pending") ? "Pending/Overdue" : "All";
    if (target.length === 0) return "No invoices found.";
    let r = `**${label} Invoices (${target.length}):**\n\n| Invoice | Client | Amount | Paid | Status | Due |\n|---|---|---|---|---|---|\n`;
    target.forEach((inv) => {
      r += `| ${inv.invoiceNumber} | ${inv.clientName} | ${formatCurrency(inv.amount)} | ${formatCurrency(inv.paidAmount)} | **${inv.status}** | ${formatDate(inv.dueDate)} |\n`;
    });
    return r;
  }

  // ── Active / on hold / closed cases ──
  if (q.match(/(active|on hold|closed|all)\s*cases/) || q.match(/how many.*case/) || q.match(/case.*summary/) || q.match(/cases.*status/)) {
    let statusFilter: string | null = null;
    if (q.includes("active")) statusFilter = "Active";
    else if (q.includes("on hold")) statusFilter = "On Hold";
    else if (q.includes("closed")) statusFilter = "Closed";

    const filtered = statusFilter ? cases.filter((c) => c.status === statusFilter) : cases;
    const label = statusFilter ?? "All";

    if (filtered.length === 0) return `No ${label.toLowerCase()} cases found.`;

    const totalOutstanding = filtered.reduce((s, c) => s + c.amountOutstanding, 0);
    let r = `**${label} Cases (${filtered.length}):**\n\n`;
    filtered.forEach((c) => {
      r += `- **${c.id}** — ${c.clientName}\n  ${c.caseType} (${c.domain}) | Stage: ${c.currentStage} | Status: **${c.status}**\n  Assigned: ${c.assignedTo} | Outstanding: ${formatCurrency(c.amountOutstanding)}\n\n`;
    });
    r += `**Total Outstanding across ${label.toLowerCase()} cases: ${formatCurrency(totalOutstanding)}**`;
    return r;
  }

  // ── Financial overview ──
  if (q.match(/financ|revenue|total.*paid|total.*received|how much.*collect|firm.*earn|money|income|overview/)) {
    const totalPaid = clients.reduce((s, c) => s + c.totalPaid, 0);
    const totalOutstanding = clients.reduce((s, c) => s + c.outstandingAmount, 0);
    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const totalReceived = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const overdueCount = invoices.filter((i) => i.status === "Overdue").length;
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    return `**Financial Overview:**\n\n| Metric | Amount |\n|---|---|\n| Total Invoiced | **${formatCurrency(totalInvoiced)}** |\n| Total Received | **${formatCurrency(totalReceived)}** |\n| Total Outstanding (Clients) | **${formatCurrency(totalOutstanding)}** |\n| Total Paid by Clients | **${formatCurrency(totalPaid)}** |\n| Overdue Invoices | **${overdueCount}** |\n| Total Expenses | **${formatCurrency(expenseTotal)}** |\n\n- **${clients.length}** Clients · **${cases.length}** Total Cases · **${cases.filter((c) => c.status === "Active").length}** Active`;
  }

  // ── Search for specific client by name ──
  const clientMatch = clients.find((c) => {
    const cName = c.name.toLowerCase();
    if (q.includes(cName)) return true;
    const parts = cName.split(/\s+/);
    return parts.some((part) => part.length > 2 && q.includes(part));
  });

  if (clientMatch) {
    const clientCases = cases.filter((c) => c.clientId === clientMatch.id);
    const clientInvoices = invoices.filter((i) => i.clientId === clientMatch.id);
    const clientComms = communicationLogs.filter((c) => c.clientId === clientMatch.id);
    const clientChats = whatsappMessages.filter((m) => m.clientId === clientMatch.id);
    const clientTasks = tasks.filter((t) => clientCases.some((c) => c.id === t.caseId));
    const clientHearings = upcomingHearings.filter((h) => clientCases.some((c) => c.id === h.caseId));

    // Cases query
    if (q.match(/case|cases|matter|matters|status|stage/)) {
      if (clientCases.length === 0) return `**${clientMatch.name}** has no cases on record.`;
      let r = `**Cases for ${clientMatch.name} (${clientCases.length}):**\n\n`;
      clientCases.forEach((c) => {
        r += `- **${c.id}** — ${c.caseType} (${c.domain})\n  Status: **${c.status}** | Stage: ${c.currentStage} (${c.stageStatus})\n  Assigned: ${c.assignedTo}${c.coAssigned ? ` + ${c.coAssigned}` : ""} | Priority: ${c.priority}\n  Fee: ${formatCurrency(c.feeAgreed)} | Received: ${formatCurrency(c.amountReceived)} | Outstanding: ${formatCurrency(c.amountOutstanding)}\n  Next Action: ${formatDate(c.nextActionDate)}${c.nextHearingDate ? ` | Hearing: ${formatDate(c.nextHearingDate)}` : ""}\n\n`;
      });
      if (clientHearings.length > 0) {
        r += `**Upcoming Hearings:**\n`;
        clientHearings.forEach((h) => {
          r += `- ${formatDate(h.date)} — ${h.court} | ${h.purpose}\n`;
        });
      }
      return r;
    }

    // Payment query
    if (q.match(/payment|invoice|bill|outstanding|paid|amount|finance|money|due|owe/)) {
      let r = `**Payment Summary — ${clientMatch.name}:**\n\n`;
      r += `| Metric | Amount |\n|---|---|\n`;
      r += `| Total Paid | **${formatCurrency(clientMatch.totalPaid)}** |\n`;
      r += `| Outstanding | **${formatCurrency(clientMatch.outstandingAmount)}** |\n`;
      if (clientInvoices.length > 0) {
        const totalInv = clientInvoices.reduce((s, i) => s + i.amount, 0);
        const totalRec = clientInvoices.reduce((s, i) => s + i.paidAmount, 0);
        r += `| Total Invoiced | ${formatCurrency(totalInv)} |\n`;
        r += `| Total Received | ${formatCurrency(totalRec)} |\n`;
        r += `\n**Invoices (${clientInvoices.length}):**\n\n`;
        clientInvoices.forEach((inv) => {
          r += `- **${inv.invoiceNumber}** — **${inv.status}**\n  Amount: ${formatCurrency(inv.amount)} | Paid: ${formatCurrency(inv.paidAmount)} | Due: ${formatDate(inv.dueDate)}\n  ${inv.description}\n\n`;
        });
      } else {
        r += `\nNo invoices on record.`;
      }
      return r;
    }

    // Communication / chat query
    if (q.match(/chat|whatsapp|message|communication|call|conversation|talk|spoke|contact/)) {
      let r = `**Communication — ${clientMatch.name}:**\n\n`;
      if (clientComms.length > 0) {
        r += `**Logs (${clientComms.length}):**\n\n`;
        clientComms
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .forEach((c) => {
            r += `- **${formatDate(c.date)}** — ${c.type}\n  ${c.summary}${c.followUpRequired ? `\n  *Follow-up: ${c.followUpDate ? formatDate(c.followUpDate) : "Required"}*` : ""}\n\n`;
          });
      }
      if (clientChats.length > 0) {
        r += `**WhatsApp Messages (${clientChats.length}):**\n\n`;
        clientChats
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .forEach((m) => {
            const dir = m.direction === "outgoing" ? "Sent" : "Received";
            const date = new Date(m.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            r += `- **${dir}** (${date})\n  "${m.message}"\n\n`;
          });
      }
      if (clientComms.length === 0 && clientChats.length === 0) {
        r += "No communication records found for this client.";
      }
      return r;
    }

    // General client info (default)
    let r = `**${clientMatch.name}** — ${clientMatch.clientType}\n\n`;
    r += `| Field | Details |\n|---|---|\n`;
    r += `| Phone | ${clientMatch.phone} |\n`;
    r += `| Email | ${clientMatch.email || "—"} |\n`;
    r += `| Address | ${clientMatch.address || "—"} |\n`;
    r += `| Source | ${clientMatch.source}${clientMatch.referredBy ? ` (Referred by ${clientMatch.referredBy})` : ""} |\n`;
    r += `| Client Since | ${formatDate(clientMatch.clientSince)} |\n`;
    r += `| Manager | ${clientMatch.relationshipManager} |\n`;
    r += `| Tags | ${clientMatch.tags.join(", ")} |\n`;
    r += `| Active / Total Cases | ${clientMatch.activeCases} / ${clientMatch.totalCases} |\n`;
    r += `| Outstanding | **${formatCurrency(clientMatch.outstandingAmount)}** |\n`;
    r += `| Total Paid | **${formatCurrency(clientMatch.totalPaid)}** |\n`;

    if (clientCases.length > 0) {
      r += `\n**Cases (${clientCases.length}):**\n`;
      clientCases.forEach((c) => {
        r += `- ${c.id} — ${c.caseType} (${c.domain}) — **${c.status}** — ${c.currentStage}\n`;
      });
    }

    if (clientInvoices.length > 0) {
      r += `\n**Invoices (${clientInvoices.length}):**\n`;
      clientInvoices.forEach((inv) => {
        r += `- ${inv.invoiceNumber} — ${formatCurrency(inv.amount)} — **${inv.status}**\n`;
      });
    }

    if (clientComms.length > 0) {
      const last = [...clientComms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      r += `\n**Last Contact:** ${last.type} on ${formatDate(last.date)} — ${last.summary}`;
    }

    if (clientTasks.length > 0) {
      const pendingTasks = clientTasks.filter((t) => t.status !== "Done");
      if (pendingTasks.length > 0) {
        r += `\n\n**Pending Tasks (${pendingTasks.length}):**\n`;
        pendingTasks.forEach((t) => {
          r += `- ${t.title} — ${t.priority} — Due: ${formatDate(t.dueDate)}\n`;
        });
      }
    }

    return r;
  }

  // ── Search by case ID ──
  const caseIdMatch = q.match(/(lit|rera|tncp|imc|ida|rev|fin)-\d{4}-\d{4}/i);
  if (caseIdMatch) {
    const caseData = cases.find((c) => c.id.toLowerCase() === caseIdMatch[0].toLowerCase());
    if (caseData) {
      const caseHearings = upcomingHearings.filter((h) => h.caseId === caseData.id);
      const caseTasks = tasks.filter((t) => t.caseId === caseData.id);
      let r = `**Case: ${caseData.id}**\n\n| Field | Details |\n|---|---|\n`;
      r += `| Client | ${caseData.clientName} |\n`;
      r += `| Domain | ${caseData.domain} |\n`;
      r += `| Type | ${caseData.caseType} |\n`;
      r += `| Status | **${caseData.status}** |\n`;
      r += `| Stage | ${caseData.currentStage} (${caseData.stageStatus}) |\n`;
      r += `| Assigned | ${caseData.assignedTo}${caseData.coAssigned ? ` + ${caseData.coAssigned}` : ""} |\n`;
      r += `| Priority | ${caseData.priority} |\n`;
      r += `| Fee Agreed | ${formatCurrency(caseData.feeAgreed)} |\n`;
      r += `| Received | ${formatCurrency(caseData.amountReceived)} |\n`;
      r += `| Outstanding | **${formatCurrency(caseData.amountOutstanding)}** |\n`;
      r += `| Next Action | ${formatDate(caseData.nextActionDate)} |\n`;
      r += `| Next Hearing | ${caseData.nextHearingDate ? formatDate(caseData.nextHearingDate) : "—"} |\n`;
      r += `| Created | ${formatDate(caseData.createdDate)} |\n`;
      r += `| Last Updated | ${formatDate(caseData.lastUpdated)} |`;

      if (caseHearings.length > 0) {
        r += `\n\n**Upcoming Hearings:**\n`;
        caseHearings.forEach((h) => {
          r += `- ${formatDate(h.date)} — ${h.court} | ${h.purpose}\n`;
        });
      }

      if (caseTasks.length > 0) {
        r += `\n\n**Tasks:**\n`;
        caseTasks.forEach((t) => {
          r += `- ${t.title} — ${t.status} | ${t.priority} | Due: ${formatDate(t.dueDate)}\n`;
        });
      }

      return r;
    }
  }

  // ── Who assigned most / top performer ──
  if (q.match(/who.*(most|highest|top|maximum).*case|busiest|most.*case|workload/)) {
    const sorted = [...employees].filter((e) => e.activeCases > 0).sort((a, b) => b.activeCases - a.activeCases);
    if (sorted.length === 0) return "No employees have active cases assigned.";
    let r = `**Team Workload (by active cases):**\n\n| Employee | Designation | Active Cases | Pending Tasks |\n|---|---|---|---|\n`;
    sorted.forEach((e) => {
      r += `| **${e.name}** | ${e.designation} | ${e.activeCases} | ${e.pendingTasks} |\n`;
    });
    return r;
  }

  // ── List all clients ──
  if (q.match(/(list|all|show|every).*client/) || q.match(/client.*(list|all)/)) {
    let r = `**All Clients (${clients.length}):**\n\n| Client | Type | Phone | Active Cases | Outstanding |\n|---|---|---|---|---|\n`;
    clients.forEach((c) => {
      r += `| **${c.name}** | ${c.clientType} | ${c.phone} | ${c.activeCases} | ${formatCurrency(c.outstandingAmount)} |\n`;
    });
    const totalOutstanding = clients.reduce((s, c) => s + c.outstandingAmount, 0);
    r += `\n**Total Outstanding: ${formatCurrency(totalOutstanding)}**`;
    return r;
  }

  // ── Domain-based search ──
  const domainMatch = q.match(/\b(litigation|rera|tncp|imc|ida|revenue|financial\s?services)\b/i);
  if (domainMatch) {
    const domainName = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    const domainCases = cases.filter((c) => c.domain.toLowerCase() === domainMatch[1].toLowerCase());
    if (domainCases.length === 0) return `No cases found under **${domainName}** domain.`;
    const active = domainCases.filter((c) => c.status === "Active");
    const outstanding = domainCases.reduce((s, c) => s + c.amountOutstanding, 0);
    let r = `**${domainName} Domain — ${domainCases.length} Cases (${active.length} active):**\n\n`;
    domainCases.forEach((c) => {
      r += `- **${c.id}** — ${c.clientName} — ${c.caseType}\n  Status: **${c.status}** | Stage: ${c.currentStage} | Assigned: ${c.assignedTo}\n\n`;
    });
    r += `**Total Outstanding: ${formatCurrency(outstanding)}**`;
    return r;
  }

  // ── How many / count queries ──
  if (q.match(/how many/)) {
    if (q.includes("client")) return `There are **${clients.length}** clients in the system.`;
    if (q.includes("case")) return `There are **${cases.length}** total cases — **${cases.filter((c) => c.status === "Active").length}** active, **${cases.filter((c) => c.status === "On Hold").length}** on hold, **${cases.filter((c) => c.status === "Closed").length}** closed.`;
    if (q.includes("employee") || q.includes("staff")) return `There are **${employees.length}** team members.`;
    if (q.includes("invoice")) return `There are **${invoices.length}** invoices — **${invoices.filter((i) => i.status === "Paid").length}** paid, **${invoices.filter((i) => i.status === "Pending").length}** pending, **${invoices.filter((i) => i.status === "Overdue").length}** overdue.`;
  }

  // ── Today / recent / what's new ──
  if (q.match(/today|recent|what'?s new|latest|update|summary|dashboard/)) {
    const activeCases = cases.filter((c) => c.status === "Active").length;
    const pendingTasks = tasks.filter((t) => t.status !== "Done").length;
    const urgentTasks = tasks.filter((t) => t.priority === "Urgent" && t.status !== "Done").length;
    const overdueInv = invoices.filter((i) => i.status === "Overdue").length;
    const totalOutstanding = clients.reduce((s, c) => s + c.outstandingAmount, 0);

    let r = `**Dashboard Summary:**\n\n`;
    r += `- **${activeCases}** active cases across **${clients.length}** clients\n`;
    r += `- **${pendingTasks}** pending tasks${urgentTasks > 0 ? ` (${urgentTasks} urgent!)` : ""}\n`;
    r += `- **${upcomingHearings.length}** upcoming hearings\n`;
    r += `- **${overdueInv}** overdue invoices\n`;
    r += `- **${formatCurrency(totalOutstanding)}** total outstanding\n`;

    if (upcomingHearings.length > 0) {
      const next = upcomingHearings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      r += `\n**Next Hearing:** ${formatDate(next.date)} — ${next.caseTitle} at ${next.court}`;
    }

    return r;
  }

  // ── Fallback ──
  return `I understand you're asking about **"${query}"**. Let me help you find what you need.\n\nTry these:\n\n- **Client info** — "Tell me about [name]" or "all clients"\n- **Cases** — "[name] cases", "active cases", or a case ID\n- **Payments** — "[name] payments", "overdue invoices", "financial overview"\n- **Communication** — "[name] chats" or "communication history"\n- **Team** — "list employees", "who has most cases"\n- **Hearings** — "upcoming hearings"\n- **Tasks** — "pending tasks", "urgent tasks"\n- **Quick stats** — "summary" or "dashboard"`;
}

// ─── Markdown Renderer ─────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|[-|:\s]+\|$/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter(Boolean).map((h) => h.trim());
      const rows = tableLines.slice(2).map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
      elements.push(
        <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <span dangerouslySetInnerHTML={{ __html: inlineFormat(h) }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-text-secondary">
                      <span dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // List item
    if (line.match(/^- /)) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].match(/^- /) || lines[i].match(/^\s\s/))) {
        listItems.push(lines[i]);
        i++;
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1.5">
          {listItems.map((item, li) => {
            const isSubItem = item.startsWith("  ");
            return (
              <li key={li} className={isSubItem ? "ml-5 text-xs text-text-muted" : "text-sm"}>
                {!isSubItem && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />}
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item.replace(/^-\s*/, "").replace(/^\s+/, "")) }} />
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    // Regular line
    elements.push(
      <p key={key++} className="my-1 text-sm leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      </p>
    );
    i++;
  }

  return elements;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-text-muted">$1</em>');
}

// ─── Component ─────────────────────────────────────────────────────

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to **LexOps AI**!\n\nI have access to all your firm's data — **${clients.length} clients**, **${cases.length} cases**, invoices, employees, hearings, and communication history.\n\nAsk me anything or pick a suggestion below to get started.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const delay = 300 + Math.random() * 600;
    setTimeout(() => {
      const response = generateResponse(trimmed);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: suggestion,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const delay = 300 + Math.random() * 600;
    setTimeout(() => {
      const response = generateResponse(suggestion);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-text-primary">LexOps AI</h1>
          <p className="text-[11px] text-text-muted">Legal practice assistant</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-700">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === "assistant" ? "bg-primary" : "bg-primary-light"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-3.5 w-3.5 text-white" />
                ) : (
                  <User className="h-3.5 w-3.5 text-white" />
                )}
              </div>

              <div
                className={`min-w-0 max-w-[85%] rounded-xl px-4 py-3 ${
                  msg.role === "assistant"
                    ? "rounded-tl-sm border border-border bg-card shadow-sm"
                    : "rounded-tr-sm bg-primary text-white"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="text-text-secondary">{renderMarkdown(msg.content)}</div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                <p
                  className={`mt-2 text-[10px] ${
                    msg.role === "assistant" ? "text-text-muted" : "text-white/50"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-text-muted">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="border-t border-border bg-card/50 px-4 py-3">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about clients, cases, payments, hearings..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            style={{ maxHeight: "100px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 100) + "px";
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:bg-primary-light disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
