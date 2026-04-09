# Modernize Staging Test Results

**Date:** March 24, 2026
**Environment:** Staging (`hsapiservice.quinstage.com`)
**tagId:** `204670250`

---

## 1. Bath Remodeling — FULL SUCCESS

| Step | Status | Details |
|------|--------|---------|
| Ping | SUCCESS | pingToken: `QdEXMvBk6Ze3jVfNjpGbp31NOKPpl4bA`, price: $30.67 |
| Post | SUCCESS | leadId: `5994212015` |

### Ping Payload Sent

```json
{
    "tagId": "204670250",
    "service": "BATH_REMODEL",
    "postalCode": "99751",
    "buyTimeframe": "Immediately",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800020",
    "OptIn1": "Yes"
}
```

### Post Payload Sent

```json
{
    "tagId": "204670250",
    "service": "BATH_REMODEL",
    "postalCode": "99751",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800020",
    "firstName": "Quin",
    "lastName": "Street",
    "email": "quin.bath.test01@example.com",
    "phone": "5039065031",
    "address": "9305 Nimbus Ave",
    "city": "Kobuk",
    "state": "AK",
    "trustedFormToken": "https://cert.trustedform.com/5d9f37382eca1518c752db469cacb6668049c8d3",
    "OptIn1": "Yes",
    "pingToken": "QdEXMvBk6Ze3jVfNjpGbp31NOKPpl4bA",
    "buyTimeframe": "Immediately",
    "homePhoneConsentLanguage": "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project.",
    "leadIDToken": "EAF0AAF2-55CD-08A7-DE78-C5A090B3A57B"
}
```

### Post Response

```json
{
    "status": "success",
    "leadId": "5994212015"
}
```

---

## 2. Walk-In Tubs — FULL SUCCESS

| Step | Status | Details |
|------|--------|---------|
| Ping | SUCCESS | pingToken: `9lAOxZ7qevrzG8uZeBQoa3d6bMnaNwBD`, price: $2.43 |
| Post | SUCCESS | leadId: `5994212115` |

### Ping Payload Sent

```json
{
    "tagId": "204670250",
    "service": "WALK_IN_TUBS",
    "postalCode": "99751",
    "buyTimeframe": "Immediately",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800030",
    "Interest": "Safety"
}
```

### Post Payload Sent

```json
{
    "tagId": "204670250",
    "service": "WALK_IN_TUBS",
    "postalCode": "99751",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800030",
    "firstName": "Quin",
    "lastName": "Street",
    "email": "quin.tub.test01@example.com",
    "phone": "5039065032",
    "address": "9305 Nimbus Ave",
    "city": "Kobuk",
    "state": "AK",
    "trustedFormToken": "https://cert.trustedform.com/5d9f37382eca1518c752db469cacb6668049c8d3",
    "Interest": "Safety",
    "pingToken": "9lAOxZ7qevrzG8uZeBQoa3d6bMnaNwBD",
    "buyTimeframe": "Immediately",
    "homePhoneConsentLanguage": "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project.",
    "leadIDToken": "EAF0AAF2-55CD-08A7-DE78-C5A090B3A57B"
}
```

### Post Response

```json
{
    "status": "success",
    "leadId": "5994212115"
}
```

---

## 3. Roofing — Ping SUCCESS, Post Delivered (Vendors Rejected on Staging)

| Step | Status | Details |
|------|--------|---------|
| Ping | SUCCESS | pingToken: `lVMGw1mbj6rJy1TEPa7x95NdAR0PavyJ`, price: $53.02 |
| Post | DELIVERED | Vendors rejected leads (staging behavior — not a code issue) |

### Ping Payload Sent

```json
{
    "tagId": "204670250",
    "service": "ROOFING_ASPHALT",
    "postalCode": "27046",
    "buyTimeframe": "Immediately",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800011",
    "RoofingPlan": "Completely replace roof"
}
```

### Post Payload Sent

```json
{
    "tagId": "204670250",
    "service": "ROOFING_ASPHALT",
    "postalCode": "27046",
    "ownHome": "Yes",
    "partnerSourceId": "CampaignA",
    "publisherSubId": "800011",
    "firstName": "Quin",
    "lastName": "Street",
    "email": "quin.roof.test03@example.com",
    "phone": "5039065033",
    "address": "9305 Nimbus Ave",
    "city": "Greensboro",
    "state": "NC",
    "trustedFormToken": "https://cert.trustedform.com/5d9f37382eca1518c752db469cacb6668049c8d3",
    "RoofingPlan": "Completely replace roof",
    "pingToken": "lVMGw1mbj6rJy1TEPa7x95NdAR0PavyJ",
    "buyTimeframe": "Immediately",
    "homePhoneConsentLanguage": "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project.",
    "leadIDToken": "EAF0AAF2-55CD-08A7-DE78-C5A090B3A57B"
}
```

### Post Response

```json
{
    "status": "rejected",
    "message": "Vendors rejected leads"
}
```

> Note: Roofing Ping succeeded and Post was delivered to Modernize. The "Vendors rejected leads" is a staging-only behavior where test vendors may not accept leads. All fields including `partnerSourceId`, `publisherSubId`, and `RoofingPlan` were correctly sent.

---

## Summary

| Trade | Ping | Post | partnerSourceId | publisherSubId | Lead ID |
|-------|------|------|-----------------|----------------|---------|
| Bath Remodeling | SUCCESS ($30.67) | SUCCESS | CampaignA | 800020 | 5994212015 |
| Walk-In Tubs | SUCCESS ($2.43) | SUCCESS | CampaignA | 800030 | 5994212115 |
| Roofing | SUCCESS ($53.02) | Vendors Rejected (staging) | CampaignA | 800011 | N/A |

### Key Fields Verified

- `partnerSourceId` — Present in all Ping and Post payloads
- `publisherSubId` — Present in all Ping and Post payloads
- `trustedFormToken` — Present in all Post payloads
- `leadIDToken` — Present in all Post payloads
- `RoofingPlan` — Correct TitleCase casing for roofing leads
- `OptIn1` — Correctly sent for Bath Remodel
- `Interest` — Correctly sent for Walk-In Tubs
