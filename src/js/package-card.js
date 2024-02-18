import { css, html, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { UUITextStyles } from 'https://cdn.skypack.dev/@umbraco-ui/uui-css';

class PackageCard extends LitElement {
    static styles = [
        UUITextStyles,
        css`
          .package-card {
            margin: auto;
          }
          
          .package-card-container {
            display: flex;
            flex-direction: column;
          }
        `,
    ];

    static properties = {
        packageId: { type: String },
    };

    generateBadgeLink(hrefUrl, imgUrl, altText) {
        return html`
            <div class="package-card">
                <a href=${hrefUrl} target="_blank" rel="noopener noreferrer nofollow">
                    <img src=${imgUrl} class="img-fluid" alt=${altText}/>
                </a>
            </div>
        `;
    }

    render() {
        const nugetDownloadsLink = this.generateBadgeLink(
            `https://www.nuget.org/packages/${this.packageId}`,
            `https://img.shields.io/nuget/dt/${this.packageId}`,
            "NuGet Downloads"
        );

        const nugetVersionLink = this.generateBadgeLink(
            `https://www.nuget.org/packages/${this.packageId}`,
            `https://img.shields.io/nuget/vpre/${this.packageId}`,
            "NuGet Latest Version"
        );

        const marketplaceLink = this.generateBadgeLink(
            `https://marketplace.umbraco.com/package/${this.packageId}`,
            "https://img.shields.io/badge/Umbraco%20Marketplace-3544b1",
            "Umbraco Marketplace"
        );

        return html`
            <div class="package-card-container uui-text">
                <h3>${this.packageId}</h3>
                ${marketplaceLink}
                ${nugetVersionLink}
                ${nugetDownloadsLink}
            </div>
        `;
    }
}

window.customElements.define('package-card', PackageCard);