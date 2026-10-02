---

### 🛡️ Automated Verification Pre-Flight Status

| Layer | Gate Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Type Check & Lint** | `npm run lint` (`tsc --noEmit`) | **PASS** | 0 type errors across the entire application |
| **Seam Test Suite** | `npx vitest run tests/unit/uiSeams.test.ts` | **PASS** | 11/11 tests passing (routing, bulk partitioning, selection teardown, pod metadata preservation) |
| **Full Unit & Integration Suite** | `npm test` | **PASS** | 25 test files / 288 tests passed, 1 skipped |
| **Production Build** | `npm run build` (`vite build`) | **PASS** | `dist/index.html` (0.80 kB), `dist/assets/index-0kB3XM10.js` (859.78 kB) compiled cleanly in 54s |
| **Backend Server** | `http://localhost:6565/api/health` | **LIVE** | Port 6565 active, DB schema v7, encrypted SQLite layer |
| **Frontend Dev Server** | `http://localhost:6464/` | **LIVE** | Port 6464 active, Vite HMR ready on LAN & localhost |

---

### 📋 The Master Human Interface Live Verification Checklist

Take all the time you need over the next day or two! Whenever you sit down to test with your mouse, open **`http://localhost:6464`** in your browser and walk through these operational circuits. Every click tests a real end-to-end seam between the DOM, WebCrypto client encryption, and the SQLite backend.

---

#### 1. 🔑 Authentication & Vault Session Seams
- [ ] **Initial Unlock**: Log in using your admin passphrase or master key. Confirm all vault counters and pods load.
- [ ] **Lock Vault**: Click the **Lock Vault** padlock button in the top navigation. Verify all sensitive fields unmount, the UI locks immediately, and no residual secrets remain in memory.
- [ ] **Re-Unlock**: Enter your key in the lock screen modal. Verify the vault re-decrypts smoothly and restores your view.

### Notes
- Note: All functions of locking & re-locking are correctly operational. 
- Small User interface nuance: The user interface doesnt update automatically when moving between unlocked vaults. The user is required to refresh the page after navigating into another unlocked vault.

---

#### 2. 🔐 Primary Credential (Password) CRUD
- [ ] **Create Password Item**:
  - Click **"+ New Item"** (or press the primary action button).
  - Fill in `Title`, `Username`, `Password`, and `URL`.
  - Add an embedded note and custom tags.
  - Test the **Password Generator**: adjust length slider, toggle symbols/numbers, click generate, and verify instant copy.
  - Click **Save**. Verify the item appears in the list pane immediately.
- [ ] **View & Field Ergonomics**:
  - Click the new item to open [`ItemDetailPane`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/src/components/ItemDetailPane.tsx).
  - Test the **Eye icon** directly to the left of the Copy button: toggle it to reveal the password in plaintext, then toggle back to mask.
  - Click **Copy**: verify the password copies to the clipboard.
- [ ] **Custom Fields & URIs**:
  - Edit the item and add a custom field (Text, Hidden, or Checkbox) and a secondary URI.
  - Save and verify the custom field renders properly with its own Eye/Copy controls.
- [ ] **Delete Single Item (The Fixed Seam)**:
  - Click the **Delete** (trash) button in the item detail pane.
  - Verify the **Reef Modernist `ConfirmDialog` modal pops up** (no native browser `window.confirm`).
  - Click **Cancel**: verify the item is NOT deleted.
  - Click **Delete** again, then click **"Confirm / Delete"**:
    - Verify the item disappears from the list pane.
    - Verify the detail pane resets cleanly to the empty state (no zombie/ghost selection).
    - Refresh the browser (`F5`): verify the item is truly gone from the server.

---

#### 3. 📝 Secure Notes CRUD
- [ ] **Create Note**:
  - Click **"+ New Item"** -> Select **Secure Note** type.
  - Enter Title, multiline text in the Notes area, and assign a Pod.
  - Click **Save**. Verify it appears in the list with the note icon badge.
- [ ] **Edit Note**:
  - Modify the text body, add a tag, and save. Verify the update persists.
- [ ] **Delete Note**:
  - Click Delete in the detail pane -> confirm in modal -> verify clean removal.

---

#### 4. 🗝️ SSH Keypair Engine & Terminal Ergonomics
- [ ] **Generate Keypair In-Browser**:
  - Click **"+ New Item"** -> Select **SSH Key**.
  - Under Key Generation, choose **Ed25519** (or RSA-4096) and click **"Generate Keypair"**.
  - Verify the WebCrypto engine generates both the OpenSSH Public Key and the PKCS#8 Private Key PEM in the form fields.
  - Save the item.
- [ ] **Dual-Key Presentation & Actions**:
  - Open the saved SSH key in the detail pane.
  - Click the **Eye icon** on the private key: verify it reveals a monospace PKCS#8 block (`-----BEGIN PRIVATE KEY-----`) with **zero raw JSON formatting leaks**.
  - Click **"Download .pem"**: verify your browser downloads a valid `.pem` file.
  - Click **"Copy Public Key"**: verify clipboard receives the standard `ssh-ed25519 AAAA...` string.
  - Click **"Copy `authorized_keys` Command"**: verify clipboard receives `echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys`.
- [ ] **Delete SSH Key**:
  - Delete via the detail pane -> confirm modal -> verify clean deletion.

---

#### 5. 🪸 Pod (Folder) Hierarchy & Safety Boundaries
- [ ] **Create Pods**:
  - In the sidebar, create a new Pod (e.g. `Infrastructure`).
  - Create a sub-pod (e.g. `Infrastructure/Cloud`).
  - Assign an item to `Infrastructure/Cloud`.
- [ ] **Rename Pod (Metadata Preservation)**:
  - Rename `Infrastructure` to `DevOps`.
  - Verify the sub-pod updates to `DevOps/Cloud`.
  - Verify the items inside retain all their tags, URIs, and history.
- [ ] **Delete Pod (Zero Data Loss Invariant)**:
  - Delete the `DevOps` pod.
  - Verify the confirmation warning informs you that items will NOT be deleted, only moved to uncategorized.
  - Confirm deletion: verify the pod disappears from the tree, and the item safely moves to the uncategorized list with all metadata intact.

---

#### 6. 🏷️ Tag Cloud & Granular Filter Bar
- [ ] **Tag Assignment**: Add tags with custom colors using the tag picker.
- [ ] **Filter Bar Selection**:
  - Click tags in the sidebar tag cloud or list filter bar to filter items.
  - Toggle between **AND** and **OR** mode in [`ItemListPane`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/src/components/ItemListPane.tsx). Verify list matches logic.
  - Click **Clear Filter**: verify the full item list restores.

---

#### 7. 📦 Batch / Bulk Operations (Phase 21 Seam)
- [ ] **Multi-Selection**:
  - In the item list, select 2 or more checkboxes (or click the master header checkbox).
  - Verify the **floating bottom action bar** slides up showing `N items selected`.
- [ ] **Bulk Move to Pod**:
  - Click **"Move to Pod"** in the action bar -> pick a pod -> confirm.
  - Verify all selected items move to the pod and retain their tags.
- [ ] **Bulk Tag**:
  - Click **"Assign Tags"** -> add a tag -> confirm.
  - Verify the tag is merged into every selected item without overwriting existing tags.
- [ ] **Bulk Delete**:
  - Click **"Delete Selected"** in the floating action bar.
  - Verify the custom `ConfirmDialog` modal warns you with the exact count of items to delete.
  - Click **Cancel**: verify nothing is deleted.
  - Click **"Delete Selected"** again and **Confirm**:
    - Verify all selected items vanish from the list.
    - Verify the floating bar dismisses.
    - Refresh the browser: verify the backend bulk deletion was atomic and permanent.

---

#### 8. 📎 The Grotto (Binary Attachments & Inline Previews)
- [ ] **Upload File**: Upload an image (PNG/JPG) or PDF to an item or via Attachments view. Verify the progress indicator completes.
- [ ] **Decrypted Preview**: Click to preview the attachment: verify the decrypted Blob renders inline in the modal.
- [ ] **Download File**: Click download: verify the decrypted file opens properly on your machine.
- [ ] **Delete Attachment**: Delete the attachment: verify confirmation and removal.

---

Whenever you finish your live test run—whether in a couple of hours or tomorrow—just drop a message with your findings or any rough edges you encountered, and we will take it from there!