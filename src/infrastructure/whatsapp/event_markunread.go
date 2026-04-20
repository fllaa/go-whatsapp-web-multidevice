package whatsapp

import (
	"context"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"
)

func handleMarkChatAsRead(ctx context.Context, evt *events.MarkChatAsRead, chatStorageRepo domainChatStorage.IChatStorageRepository, client *whatsmeow.Client) {
	if evt == nil || chatStorageRepo == nil || client == nil || evt.Action == nil {
		return
	}

	deviceID := client.Store.ID.ToNonAD().String()
	if deviceID == "" {
		return
	}

	jid := NormalizeJIDFromLID(ctx, evt.JID, client).String()
	unread := !evt.Action.GetRead()

	if unread {
		if err := chatStorageRepo.MarkChatUnread(deviceID, jid, true); err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{"device_id": deviceID, "chat_jid": jid}).Warn("Failed to mark chat unread from app state event")
			return
		}
	} else {
		if err := chatStorageRepo.ResetUnreadCount(deviceID, jid); err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{"device_id": deviceID, "chat_jid": jid}).Warn("Failed to reset unread state from app state event")
			return
		}
	}

	if len(config.WhatsappWebhook) > 0 || config.ChatwootEnabled {
		go func() {
			webhookCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := ForwardChatUnreadToWebhook(webhookCtx, deviceID, jid, unread, 0); err != nil {
				logrus.WithError(err).WithFields(logrus.Fields{"device_id": deviceID, "chat_jid": jid}).Warn("Failed to forward unread event to webhook")
			}
		}()
	}
}
