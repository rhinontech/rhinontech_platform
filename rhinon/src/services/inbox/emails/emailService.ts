// /services/gmail.service.ts

interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  base64: string;
}

interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  cc?: string;
  date: string | null;
  html: string;
  snippet: string;
  attachments: GmailAttachment[];
  labelIds: string[];
}

interface GmailThread {
  id: string;
  messages: GmailEmail[];
  snippet: string;
  historyId: string;
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  threads?: { id: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

class GmailService {
  private baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me";

  /**
   * Fetch all emails from inbox
   */
  // gmailService.ts
  async getAllEmails(
    accessToken: string,
    maxResults: number = 20,
    pageToken?: string
  ): Promise<{
    emails: GmailEmail[];
    nextPageToken?: string;
    resultSizeEstimate: any;
  }> {
    try {
      const url = new URL(`${this.baseUrl}/messages`);
      url.searchParams.set("labelIds", "INBOX");
      url.searchParams.set("maxResults", maxResults.toString());
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const listRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listRes.ok) {
        throw new Error(`Failed to fetch email list: ${listRes.statusText}`);
      }

      const listData: GmailListResponse = await listRes.json();

      if (!listData.messages || listData.messages.length === 0) {
        console.log("📭 No emails found");
        return { emails: [], nextPageToken: undefined, resultSizeEstimate: 0 };
      }

      const emails = await Promise.all(
        listData.messages.map((msg) => this.getEmailById(accessToken, msg.id))
      );

      console.log("📩 Emails fetched:", emails.length);
      return {
        emails,
        nextPageToken: listData.nextPageToken,
        resultSizeEstimate: listData.resultSizeEstimate,
      };
    } catch (err) {
      console.error("❌ Error fetching emails:", err);
      throw err;
    }
  }

  /**
   * Fetch a single email by ID
   */
  async getEmailById(
    accessToken: string,
    emailId: string
  ): Promise<GmailEmail> {
    try {
      const messageRes = await fetch(`${this.baseUrl}/messages/${emailId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!messageRes.ok) {
        throw new Error(
          `Failed to fetch email ${emailId}: ${messageRes.statusText}`
        );
      }

      const messageData = await messageRes.json();
      return this.parseEmailData(messageData, accessToken);
    } catch (err) {
      console.error(`❌ Error fetching email ${emailId}:`, err);
      throw err;
    }
  }

  /**
   * Fetch entire thread/conversation by thread ID
   */
  async getThreadById(
    accessToken: string,
    threadId: string
  ): Promise<GmailThread> {
    try {
      const threadRes = await fetch(`${this.baseUrl}/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!threadRes.ok) {
        throw new Error(
          `Failed to fetch thread ${threadId}: ${threadRes.statusText}`
        );
      }

      const threadData = await threadRes.json();

      // Parse all messages in the thread
      const messages = await Promise.all(
        threadData.messages.map((msg: any) =>
          this.parseEmailData(msg, accessToken)
        )
      );

      console.log(`🧵 Thread fetched: ${messages.length} messages`);

      return {
        id: threadData.id,
        messages: messages,
        snippet: threadData.snippet || "",
        historyId: threadData.historyId,
      };
    } catch (err) {
      console.error(`❌ Error fetching thread ${threadId}:`, err);
      throw err;
    }
  }

  /**
   * Parse email data from Gmail API response
   */
  private async parseEmailData(
    messageData: any,
    accessToken: string
  ): Promise<GmailEmail> {
    const emailId = messageData.id;
    const threadId = messageData.threadId;

    // Parse headers
    const headers = messageData.payload.headers;
    const subjectHeader = headers.find((h: any) => h.name === "Subject");
    const dateHeader = headers.find((h: any) => h.name === "Date");
    const fromHeader = headers.find((h: any) => h.name === "From");
    const toHeader = headers.find((h: any) => h.name === "To");
    const ccHeader = headers.find((h: any) => h.name === "Cc");

    const subject = subjectHeader ? subjectHeader.value : "(no subject)";
    const date = dateHeader ? new Date(dateHeader.value).toISOString() : null;
    const from = fromHeader ? fromHeader.value : "(unknown sender)";
    const to = toHeader ? toHeader.value : undefined;
    const cc = ccHeader ? ccHeader.value : undefined;

    // Recursive function to find HTML body
    const findHtmlPart = (parts: any[]): string | null => {
      for (const part of parts || []) {
        if (part.mimeType === "text/html" && part.body?.data) {
          return part.body.data;
        }
        if (part.parts) {
          const nested = findHtmlPart(part.parts);
          if (nested) return nested;
        }
      }
      return null;
    };

    const htmlData =
      messageData.payload.mimeType === "text/html"
        ? messageData.payload.body.data
        : findHtmlPart(messageData.payload.parts);

    const html = htmlData
      ? Buffer.from(htmlData, "base64").toString("utf8")
      : "";

    // Find attachments
    const attachments: any[] = [];
    const findAttachments = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            attachmentId: part.body.attachmentId,
          });
        }
        if (part.parts) findAttachments(part.parts);
      }
    };

    if (messageData.payload.parts) {
      findAttachments(messageData.payload.parts);
    }

    // Download attachments (if any)
    const attachmentFiles = await Promise.all(
      attachments.map(async (att) => {
        const attachRes = await fetch(
          `${this.baseUrl}/messages/${emailId}/attachments/${att.attachmentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const attachData = await attachRes.json();

        const fileData = Buffer.from(attachData.data, "base64");
        return {
          filename: att.filename,
          mimeType: att.mimeType,
          size: fileData.length,
          base64: attachData.data,
        };
      })
    );

    return {
      id: emailId,
      threadId: threadId,
      subject,
      from,
      to,
      cc,
      date,
      html,
      snippet: messageData.snippet || "",
      attachments: attachmentFiles,
      labelIds: messageData.labelIds || [],
    };
  }
}

// Export singleton instance
export const gmailService = new GmailService();
export type { GmailEmail, GmailAttachment, GmailThread };
