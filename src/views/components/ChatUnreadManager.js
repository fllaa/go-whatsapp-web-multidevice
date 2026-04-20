import FormRecipient from "./generic/FormRecipient.js";

export default {
    name: 'ChatUnreadManager',
    components: {
        FormRecipient
    },
    data() {
        return {
            type: window.TYPEUSER,
            phone: '',
            unread: true,
            loading: false,
        }
    },
    computed: {
        phone_id() {
            return this.phone + this.type;
        },
    },
    methods: {
        isValidForm() {
            return this.phone.trim().length > 0;
        },
        openModal() {
            $('#modalChatUnread').modal({
                onApprove: function () {
                    return false;
                }
            }).modal('show');
        },
        async handleSubmit() {
            if (!this.isValidForm() || this.loading) {
                return;
            }
            try {
                const response = await this.submitApi();
                showSuccessInfo(response);
                $('#modalChatUnread').modal('hide');
                if (window.ChatListComponent && window.ChatListComponent.loadChats) {
                    window.ChatListComponent.loadChats();
                }
            } catch (err) {
                showErrorInfo(err);
            }
        },
        async submitApi() {
            this.loading = true;
            try {
                const payload = {
                    unread: this.unread
                };

                const response = await window.http.post(`/chat/${this.phone_id}/unread`, payload);
                this.handleReset();
                return response.data.message;
            } catch (error) {
                if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
                throw error;
            } finally {
                this.loading = false;
            }
        },
        handleReset() {
            this.phone = '';
            this.unread = true;
        },
    },
    template: `
    <div class="purple card" @click="openModal()" style="cursor: pointer">
        <div class="content">
            <a class="ui purple right ribbon label">Chat</a>
            <div class="header">Unread Chat</div>
            <div class="description">
                Mark a chat unread or clear its unread state
            </div>
        </div>
    </div>
    
    <div class="ui small modal" id="modalChatUnread">
        <i class="close icon"></i>
        <div class="header">
            Mark Chat Unread
        </div>
        <div class="content">
            <form class="ui form">
                <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="false"/>
                <div class="field">
                    <label>Action</label>
                    <div class="ui toggle checkbox">
                        <input type="checkbox" aria-label="unread" v-model="unread">
                        <label>Mark chat unread (uncheck to mark as read)</label>
                    </div>
                </div>
            </form>
        </div>
        <div class="actions">
            <button class="ui approve positive right labeled icon button" 
                 :class="{'disabled': !isValidForm() || loading}"
                 @click.prevent="handleSubmit">
                {{ unread ? 'Mark Unread' : 'Mark Read' }}
                <i class="mail icon"></i>
            </button>
        </div>
    </div>
    `
}
