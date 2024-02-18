import { css, html, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class PackageSync extends LitElement {
    static properties = {
        packageId: { type: String },
        showPackageCard: { type: Boolean },
        isLoading: { type: Boolean },
        progress: { type: Number },
        notifications: { type: Array },
        packageSlot: { type: LitElement },
        isDisabled: { type: Boolean }
    };

    constructor() {
        super();
        this.packageId = '';
        this.showPackageCard = false;
        this.isLoading = false;
        this.progress = -1;
        this.notifications = [];
        this.isDisabled = false;
        this.placeholders = [
            'Umbraco.Forms',
            'uSync',
            'Contentment',
            'Umbraco.Community.SimpleDashboards',
            'Umbraco.Community.SimpleContentApps',
            'SEOChecker',
            'Diplo.GodMode'
        ]
    }

    showNotification(headline, type, message = null) {

        const showMessage = message !== null;
        const description = html`
            <p>${message}</p>
        `;

        this.notifications.push(
            html`
                <uui-toast-notification name=${headline}
                                        .color=${type}
                                        .autoClose=${9000}">
                    <h3>${headline}</h3>
                    ${showMessage ? description : ''}
                </uui-toast-notification>
            `);
    }

    async getNugetPackage(packageId) {
        const url = `https://api-v2v3search-0.nuget.org/query?q=packageId:${packageId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async sendData(e) {
        this.showPackageCard = false;
        this.isLoading = true;
        this.isDisabled = true;
        const data = {
            PackageId: this.packageId
        };
        const nuget = await this.getNugetPackage(data.PackageId);
        const exists = nuget !== null && nuget.data.length > 0;
        if (!exists) {
            this.isLoading = false;
            const message = html`<span>Failed to find <span style="font-weight: bold">${data.PackageId}</span> on NuGet</span>`;
            this.showNotification(`Request failed`, 'danger', message)
            return;
        }
        this.packageId = nuget.data[0].title;

        const response = await this.postToUmbraco(data);

        this.isLoading = false;
        this.isDisabled = false;

        if (response.success) {
            const message = html`<span><span
                    style="font-weight: bold">${data.PackageId}</span> will be updated soon</span>`;
            this.showNotification('Request successful!', 'positive', message);
            this.showPackageCard = true
            return;
        }

        if (response.retry > 0) {
            this.showNotification('Too many requests', 'danger', `Try again in ${response.retry} seconds`);
            return;
        }

        this.showNotification('Request failed', 'danger');
    }

    async postToUmbraco(data) {
        try {
            const response = await fetch('https://functions.marketplace.umbraco.com/api/InitiateSinglePackageSyncFunction', {
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });

            if (response.ok) {
                return { success: true, retry: null };
            }
            const max = response.headers.get('Retry-After');
            return { success: response.ok, retry: +max };
        } catch (error) {
            return { success: false, retry: 0 };
        }
    }

    _handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        if (this.isDisabled || !form.checkValidity()) {
            return;
        }
        this.sendData();
    }

    _handleInputChange(e) {
        const val = e.target.value;
        if (val !== this.packageId) {
            this.isDisabled = false;
            this.packageId = val;
            this.showPackageCard = false;
        }
    }

    getPlaceholder() {
        return this.getRandomItemFromArray(this.placeholders)
    }

    getRandomItemFromArray(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    render() {
        const loader = html`
            <uui-loader-bar id="loader"></uui-loader-bar>
        `;

        const packageSlot = html`
            <package-card packageId="${this.packageId}"></package-card>
        `;

        return html`
            <div id="app" class="uui-text">
                <uui-box headline="Umbraco Marketplace Package Sync">
                    <uui-form>
                        <form id="form" @submit=${this._handleSubmit}>
                            <h3>Ask Umbraco to index your package!</h3>
                            <uui-form-layout-item description="Enter your Umbraco Package Id">
                                <uui-label slot="label" for="packageId" required="true">Package Id
                                </uui-label>
                                <uui-input .value=${this.packageId} @input=${this._handleInputChange}
                                           style="min-width: 360px; text-align: center" title="Umbraco Package Id"
                                           label="Package Id:"
                                           id="packageId" name="packageId" required="true"
                                           requiredMessage="Package Id is required"
                                           placeholder="${this.getPlaceholder()}"></uui-input>
                                <uui-form-validation-message>
                                </uui-form-validation-message>
                            </uui-form-layout-item>
                            <uui-form-layout-item>
                                <uui-button type="submit" look="primary" id="submitButton" ?disabled=${this.isDisabled}>
                                    Submit
                                </uui-button>
                            </uui-form-layout-item>
                        </form>
                    </uui-form>
                    ${this.isLoading ? loader : ""}
                    ${this.showPackageCard ? packageSlot : ''}
                </uui-box>
                <uui-toast-notification-container
                        id="toastContainer"
                        auto-close="7000"
                        bottom-up=""
                        style="top:0; left:0; right:0; height: 100vh; padding: var(--uui-size-layout-1);">
                    ${this.notifications}
                </uui-toast-notification-container>
            </div>
        `;
    }
}

window.customElements.define('package-sync', PackageSync);