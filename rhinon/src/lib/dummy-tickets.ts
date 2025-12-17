// Dummy tickets data with reply threads

export interface TicketReply {
  id: string;
  from: string;
  to: string;
  content: string;
  date: string;
  attachments: { filename: string; size: number }[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  from: string;
  priority: "low" | "medium" | "high";
  status: "all" | "open" | "in_progress" | "resolved";
  created: string;
  updated: string;
  replies: TicketReply[];
}

export const dummyTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Login page not responsive on mobile",
    description:
      "The login page breaks on mobile devices below 375px width. Users on small phones cannot see the login form properly.",
    from: "john.doe@company.com",
    priority: "high",
    status: "in_progress",
    created: "2025-11-04T10:30:00Z",
    updated: "2025-11-06T14:20:00Z",
    replies: [
      {
        id: "REP-001-1",
        from: "john.doe@company.com",
        to: "support@company.com",
        content:
          "I've attached screenshots showing the issue. The form fields are stacked incorrectly and buttons are overlapping.",
        date: "2025-11-04T10:30:00Z",
        attachments: [
          { filename: "mobile-issue-1.png", size: 245 },
          { filename: "mobile-issue-2.png", size: 312 },
        ],
      },
      {
        id: "REP-001-2",
        from: "support@company.com",
        to: "john.doe@company.com",
        content:
          "Thank you for reporting this. We've identified the issue in our CSS media queries. Our team is working on a fix.",
        date: "2025-11-04T14:15:00Z",
        attachments: [],
      },
      {
        id: "REP-001-3",
        from: "john.doe@company.com",
        to: "support@company.com",
        content:
          "Great! Looking forward to the fix. Can you let me know the estimated timeline?",
        date: "2025-11-05T09:00:00Z",
        attachments: [],
      },
      {
        id: "REP-001-4",
        from: "support@company.com",
        to: "john.doe@company.com",
        content:
          "We expect to have the fix deployed by end of this week. We'll notify you once it's live.",
        date: "2025-11-06T10:45:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "TKT-002",
    title: "Payment processing failing for international users",
    description:
      "Customers from outside the US are experiencing payment failures during checkout. Error code: PAYMENT_GATEWAY_ERROR.",
    from: "sarah.smith@ecommerce.com",
    priority: "high",
    status: "open",
    created: "2025-11-05T08:00:00Z",
    updated: "2025-11-06T11:30:00Z",
    replies: [
      {
        id: "REP-002-1",
        from: "sarah.smith@ecommerce.com",
        to: "support@company.com",
        content:
          "We've lost 3 orders today from UK and Canada due to this issue. This needs urgent attention!",
        date: "2025-11-05T08:00:00Z",
        attachments: [
          { filename: "failed-transactions.csv", size: 45 },
        ],
      },
      {
        id: "REP-002-2",
        from: "support@company.com",
        to: "sarah.smith@ecommerce.com",
        content:
          "We're investigating this now. This appears to be related to currency conversion settings in our payment gateway.",
        date: "2025-11-05T13:20:00Z",
        attachments: [],
      },
      {
        id: "REP-002-3",
        from: "support@company.com",
        to: "sarah.smith@ecommerce.com",
        content:
          "We've found the issue - currency format was incorrect for non-USD transactions. Fix is in testing now.",
        date: "2025-11-06T09:15:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "TKT-003",
    title: "Database backup failure notification",
    description:
      "Automated database backup scheduled for 2 AM failed. The backup process timed out after 30 minutes.",
    from: "ops-team@company.com",
    priority: "medium",
    status: "resolved",
    created: "2025-11-03T02:30:00Z",
    updated: "2025-11-05T16:45:00Z",
    replies: [
      {
        id: "REP-003-1",
        from: "ops-team@company.com",
        to: "support@company.com",
        content:
          "Backup failed at 02:15 AM. Database size is 145GB. Please advise on increasing timeout or storage allocation.",
        date: "2025-11-03T02:30:00Z",
        attachments: [
          { filename: "backup-logs.txt", size: 128 },
        ],
      },
      {
        id: "REP-003-2",
        from: "support@company.com",
        to: "ops-team@company.com",
        content:
          "We've increased the backup timeout from 30 to 60 minutes. Also allocating more storage. Manual backup initiated.",
        date: "2025-11-03T08:00:00Z",
        attachments: [],
      },
      {
        id: "REP-003-3",
        from: "ops-team@company.com",
        to: "support@company.com",
        content:
          "Manual backup completed successfully. Next scheduled backup is tonight. We'll monitor it.",
        date: "2025-11-03T14:30:00Z",
        attachments: [],
      },
      {
        id: "REP-003-4",
        from: "support@company.com",
        to: "ops-team@company.com",
        content:
          "Perfect! Issue resolved. Closing ticket. Will continue monitoring the backups. Thanks!",
        date: "2025-11-05T16:45:00Z",
        attachments: [],
      },
    ],
  },
];
