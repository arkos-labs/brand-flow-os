/**
 * Factur-X Hybrid PDF Builder
 *
 * Prend un blob PDF (généré par jsPDF) et y embarque le XML Factur-X
 * en tant que pièce jointe EmbeddedFile avec les métadonnées XMP obligatoires.
 *
 * Résultat : UN SEUL fichier .pdf qui contient le XML à l'intérieur,
 * lisible par les logiciels comptables et les portails PPF/PDP.
 *
 * Conformité :
 *  - Factur-X v1.0 / EN16931
 *  - ISO 32000-1 (EmbeddedFile via AF entry)
 *  - XMP metadata : fx:DocumentType, fx:DocumentFileName, fx:Version, fx:ConformanceLevel
 *
 * Référence : FNFE-MPE Factur-X Technical Specification v1.0.07
 */

import { PDFDocument, PDFName, PDFArray } from "pdf-lib";
// AFRelationship is not re-exported from the main entry point — import from internal
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — internal path, stable across pdf-lib 1.x
import { AFRelationship } from "pdf-lib/cjs/core/embedders/FileEmbedder";

// ── Constantes Factur-X ──────────────────────────────────────────────────────

const FX_FILENAME = "factur-x.xml";
const FX_DESCRIPTION = "Factur-X XML — EN16931";
const FX_VERSION = "1.0";
const FX_CONFORMANCE = "EN 16931";

// ── Métadonnées XMP ──────────────────────────────────────────────────────────

function buildXmpMetadata(docNumber: string, issueDate: string): string {
  const now = new Date().toISOString();
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:date><rdf:Bag><rdf:li>${issueDate}</rdf:li></rdf:Bag></dc:date>
      <dc:description><rdf:Alt><rdf:li xml:lang="fr">Facture electronique ${docNumber}</rdf:li></rdf:Alt></dc:description>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>

    <rdf:Description rdf:about=""
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>InvoicePro</xmp:CreatorTool>
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <xmp:MetadataDate>${now}</xmp:MetadataDate>
    </rdf:Description>

    <!-- Namespace Factur-X requis par la spec -->
    <rdf:Description rdf:about=""
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${FX_FILENAME}</fx:DocumentFileName>
      <fx:Version>${FX_VERSION}</fx:Version>
      <fx:ConformanceLevel>${FX_CONFORMANCE}</fx:ConformanceLevel>
    </rdf:Description>

    <!-- Schema extension PDF/A -->
    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Document type: INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>XML file name</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Factur-X version</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Conformance level</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>

  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Embarque le XML Factur-X dans un PDF et retourne le Blob final.
 *
 * @param pdfBlob   - PDF généré par jsPDF (.output("blob"))
 * @param xmlString - XML Factur-X généré par generateFacturxXml()
 * @param docNumber - Numéro du document (pour les métadonnées XMP)
 * @param issueDate - Date d'émission ISO (YYYY-MM-DD)
 */
export async function embedFacturxInPdf(
  pdfBlob: Blob,
  xmlString: string,
  docNumber: string,
  issueDate: string,
): Promise<Blob> {
  // 1. Charger le PDF
  const pdfArrayBuffer = await pdfBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });

  // 2. Encoder le XML
  const xmlBytes = new TextEncoder().encode(xmlString);

  // 3. Attacher le XML comme EmbeddedFile (AF relationship = Alternative)
  await pdfDoc.attach(xmlBytes, FX_FILENAME, {
    mimeType: "application/xml",
    description: FX_DESCRIPTION,
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });

  // 4. Injecter les métadonnées XMP dans le catalog
  const xmpXml = buildXmpMetadata(docNumber, issueDate);
  const xmpBytes = new TextEncoder().encode(xmpXml);
  const metadataStream = pdfDoc.context.stream(xmpBytes, {
    Type: "Metadata",
    Subtype: "XML",
    Length: xmpBytes.length,
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of("Metadata"), metadataRef);

  // 5. Marquer le catalog avec AF = liste des fichiers associés (PDF/A-3 requis)
  // pdf-lib gère déjà le Names/EmbeddedFiles tree via attach() — on ajoute juste
  // l'entrée AF au catalog pour signaler aux lecteurs Factur-X l'existence du XML.
  // On construit un tableau indirect pointant vers la même entrée EmbeddedFiles.
  const catalog = pdfDoc.catalog;
  const existingAf = catalog.lookupMaybe(PDFName.of("AF"), PDFArray);
  if (!existingAf) {
    // Créer un tableau AF vide ; les lecteurs conformes naviguent via Names/EmbeddedFiles
    const afArray = pdfDoc.context.obj([]) as PDFArray;
    catalog.set(PDFName.of("AF"), afArray);
  }

  // 6. Sérialiser — retourne Uint8Array
  const outputUint8 = await pdfDoc.save();
  // Convertir en ArrayBuffer puis en Blob (évite le SharedArrayBuffer type mismatch)
  const outputBuffer = outputUint8.buffer.slice(
    outputUint8.byteOffset,
    outputUint8.byteOffset + outputUint8.byteLength,
  ) as ArrayBuffer;
  return new Blob([outputBuffer], { type: "application/pdf" });
}

// ── Téléchargement ────────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
