import React from "react";
import { 
  PdfSVG, WordSVG, ExcelSVG, PptSVG, 
  ImageSVG, VideoSVG, ZipSVG, DefaultSVG 
} from "./FileIcons";

// 1. Mapa de extensiones (Sin tipos de TypeScript)
const ICON_MAP = {
  pdf: PdfSVG,
  doc: WordSVG,
  docx: WordSVG,
  txt: DefaultSVG,
  rtf: WordSVG,
  xls: ExcelSVG,
  xlsx: ExcelSVG,
  csv: ExcelSVG,
  ppt: PptSVG,
  pptx: PptSVG,
  jpg: ImageSVG,
  jpeg: ImageSVG,
  png: ImageSVG,
  gif: ImageSVG,
  svg: ImageSVG,
  webp: ImageSVG,
  ico: ImageSVG,
  mp4: VideoSVG,
  mov: VideoSVG,
  avi: VideoSVG,
  mkv: VideoSVG,
  zip: ZipSVG,
  rar: ZipSVG,
  "7z": ZipSVG,
  tar: ZipSVG,
  gz: ZipSVG,
};

// 2. Componente (Quitamos ": Props")
export default function FolderIcons({ name, size = 45 }) {
  // DETECTAR: Cortamos por el punto y sacamos la extensión
  const extension = name.split('.').pop()?.toLowerCase() || "";

  // ELEGIR: Buscamos en el objeto ICON_MAP
  const IconToRender = ICON_MAP[extension] || DefaultSVG;

  // RENDERIZAR
  return <IconToRender size={size} />;
}