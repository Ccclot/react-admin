import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  Upload,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
  HighlightOutlined,
  LeftOutlined,
  LineOutlined,
  PlusSquareOutlined,
  RightOutlined,
  SafetyOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import * as pdfjsLib from 'pdfjs-dist';
import { Arrow, Group, Layer, Rect, Stage, Text as KonvaText } from 'react-konva';

type ToolType = 'select' | 'rect' | 'highlight' | 'arrow' | 'note';
type AnnotationType = 'rect' | 'highlight' | 'arrow' | 'note';

interface PdfFileMeta {
  name: string;
  size: number;
  lastModified: number;
  source: 'upload' | 'sample';
}

interface Annotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  createdAt: number;
}

interface DraftAnnotation {
  type: Exclude<AnnotationType, 'note'>;
  pageNumber: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface NoteDraft {
  pageNumber: number;
  x: number;
  y: number;
}

interface TextAnnotationDraft {
  type: Exclude<AnnotationType, 'arrow' | 'note'>;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface PersistedState {
  annotations: Annotation[];
  currentPage: number;
  zoom: number;
}

const SAMPLE_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const NOTE_COLORS = ['#1677ff', '#fa8c16', '#52c41a', '#eb2f96', '#722ed1'];

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

const getStorageKey = (meta: PdfFileMeta | null) =>
  meta ? `pdf-edit-demo:${meta.source}:${meta.name}:${meta.size}:${meta.lastModified}` : '';

const toNormalizedPoint = (x: number, y: number, width: number, height: number) => ({
  x: width > 0 ? x / width : 0,
  y: height > 0 ? y / height : 0,
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeBox = (startX: number, startY: number, endX: number, endY: number) => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  return { x, y, width, height };
};

const downloadBlob = (filename: string, blob: Blob) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getAnnotationTitle = (annotation: Annotation) => {
  if (annotation.type === 'note') {
    return annotation.text || '便签批注';
  }
  if (annotation.type === 'arrow') {
    return '箭头指引';
  }
  if (annotation.type === 'highlight') {
    return '高亮标注';
  }
  return '框选标注';
};

const PdfEditPage: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfFileMeta, setPdfFileMeta] = useState<PdfFileMeta | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [tool, setTool] = useState<ToolType>('rect');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [draft, setDraft] = useState<DraftAnnotation | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [textAnnotationDraft, setTextAnnotationDraft] = useState<TextAnnotationDraft | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const storageKey = useMemo(() => getStorageKey(pdfFileMeta), [pdfFileMeta]);

  const currentPageAnnotations = useMemo(
    () => annotations.filter((item) => item.pageNumber === currentPage),
    [annotations, currentPage],
  );

  const resetEditorState = useCallback(() => {
    setAnnotations([]);
    setCurrentPage(1);
    setPageCount(0);
    setPdfDoc(null);
    setPageSize({ width: 0, height: 0 });
    setSelectedAnnotationId(null);
    setDraft(null);
    setNoteDraft(null);
    setTextAnnotationDraft(null);
    setRenderLoading(false);
    setFileLoading(false);
  }, []);

  const restorePersistedState = useCallback((meta: PdfFileMeta) => {
    const key = getStorageKey(meta);
    if (!key || typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const persisted = JSON.parse(raw) as PersistedState;
      if (Array.isArray(persisted.annotations)) {
        setAnnotations(persisted.annotations);
      }
      if (persisted.currentPage) {
        setCurrentPage(persisted.currentPage);
      }
      if (persisted.zoom) {
        setZoom(persisted.zoom);
      }
    } catch (error) {
      console.error('restore persisted pdf editor state failed', error);
    }
  }, []);

  const persistState = useCallback(
    (nextAnnotations: Annotation[], nextPage: number, nextZoom: number) => {
      if (typeof window === 'undefined' || !storageKey) {
        return;
      }

      const payload: PersistedState = {
        annotations: nextAnnotations,
        currentPage: nextPage,
        zoom: nextZoom,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    [storageKey],
  );

  const loadPdfBuffer = useCallback(
    async (buffer: ArrayBuffer, meta: PdfFileMeta) => {
      setFileLoading(true);
      setRenderLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: buffer,
          useWorkerFetch: false,
        });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setPdfFileMeta(meta);
        setFileName(meta.name);
        setPageCount(doc.numPages);
        setCurrentPage(1);
        setDraft(null);
        setNoteDraft(null);
        setTextAnnotationDraft(null);
        setSelectedAnnotationId(null);

        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            restorePersistedState(meta);
          });
        }
      } catch (error) {
        console.error(error);
        message.error('PDF 加载失败，请检查文件格式或网络');
        resetEditorState();
      } finally {
        setFileLoading(false);
        setRenderLoading(false);
      }
    },
    [resetEditorState, restorePersistedState],
  );

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        message.warning('请上传 PDF 文件');
        return false;
      }

      const buffer = await file.arrayBuffer();
      await loadPdfBuffer(buffer, {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        source: 'upload',
      });
      message.success('PDF 文件已加载');
      return true;
    },
    [loadPdfBuffer],
  );

  const loadSamplePdf = useCallback(async () => {
    setFileLoading(true);
    try {
      const response = await fetch(SAMPLE_PDF_URL);
      if (!response.ok) {
        throw new Error(`sample pdf http ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      await loadPdfBuffer(buffer, {
        name: 'sample-report.pdf',
        size: buffer.byteLength,
        lastModified: Date.now(),
        source: 'sample',
      });
      message.success('示例 PDF 已加载');
    } catch (error) {
      console.error(error);
      message.error('示例 PDF 加载失败，建议直接上传本地 PDF 继续体验');
    } finally {
      setFileLoading(false);
    }
  }, [loadPdfBuffer]);

  const renderCurrentPage = useCallback(async (doc: any, pageNumber: number, scale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    if (renderTaskRef.current?.cancel) {
      try {
        renderTaskRef.current.cancel();
      } catch (error) {
        console.warn('cancel previous render task failed', error);
      }
    }

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    setPageSize({ width: viewport.width, height: viewport.height });

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    try {
      setRenderLoading(true);
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
    } finally {
      setRenderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) {
      return;
    }

    let mounted = true;
    const task = async () => {
      try {
        await renderCurrentPage(pdfDoc, currentPage, zoom);
      } catch (error) {
        if (mounted) {
          console.error(error);
          message.error('PDF 页面渲染失败');
        }
      }
    };
    void task();

    return () => {
      mounted = false;
      if (renderTaskRef.current?.cancel) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          console.warn('render task cleanup failed', error);
        }
      }
    };
  }, [pdfDoc, currentPage, zoom, renderCurrentPage]);

  useEffect(() => {
    persistState(annotations, currentPage, zoom);
  }, [annotations, currentPage, persistState, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotationId) {
        event.preventDefault();
        setAnnotations((prev) => prev.filter((item) => item.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
        message.success('批注已删除');
      }
      if (event.key === 'Escape') {
        setDraft(null);
        setNoteDraft(null);
        setTextAnnotationDraft(null);
        setNoteModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId]);

  const clearCurrentPage = useCallback(() => {
    setAnnotations((prev) => prev.filter((item) => item.pageNumber !== currentPage));
    setSelectedAnnotationId(null);
    message.success('当前页批注已清空');
  }, [currentPage]);

  const clearAll = useCallback(() => {
    Modal.confirm({
      title: '清空全部批注',
      content: '确定要清空当前文件的所有批注吗？',
      okText: '清空',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setAnnotations([]);
        setSelectedAnnotationId(null);
        message.success('所有批注已清空');
      },
    });
  }, []);

  const startDrawing = useCallback(
    (stage: any) => {
      if (!pdfDoc || tool === 'select') {
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        return;
      }

      if (tool === 'note') {
        setNoteDraft({ pageNumber: currentPage, x: pointer.x, y: pointer.y });
        setNoteModalOpen(true);
        form.setFieldsValue({
          text: '',
        });
        return;
      }

      if (tool === 'rect' || tool === 'highlight' || tool === 'arrow') {
        setDraft({
          type: tool,
          pageNumber: currentPage,
          startX: pointer.x,
          startY: pointer.y,
          endX: pointer.x,
          endY: pointer.y,
        });
      }
    },
    [currentPage, form, pdfDoc, tool],
  );

  const updateDrawing = useCallback(
    (stage: any) => {
      if (!draft) {
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        return;
      }

      setDraft((prev) =>
        prev
          ? {
              ...prev,
              endX: clamp(pointer.x, 0, pageSize.width),
              endY: clamp(pointer.y, 0, pageSize.height),
            }
          : prev,
      );
    },
    [draft, pageSize.height, pageSize.width],
  );

  const finishDrawing = useCallback(() => {
    if (!draft) {
      return;
    }

    const { x, y, width, height } = normalizeBox(
      draft.startX,
      draft.startY,
      draft.endX,
      draft.endY,
    );
    if (width < 6 || height < 6) {
      setDraft(null);
      return;
    }

    const id = `ann-${Date.now()}`;
    const baseColor =
      draft.type === 'highlight'
        ? 'rgba(255, 235, 59, 0.45)'
        : draft.type === 'arrow'
          ? '#fa8c16'
          : '#1677ff';
    const normalizedStart = toNormalizedPoint(draft.startX, draft.startY, pageSize.width, pageSize.height);
    const normalizedEnd = toNormalizedPoint(draft.endX, draft.endY, pageSize.width, pageSize.height);
    const normalizedBox = {
      ...toNormalizedPoint(x, y, pageSize.width, pageSize.height),
      width: pageSize.width > 0 ? width / pageSize.width : width,
      height: pageSize.height > 0 ? height / pageSize.height : height,
    };

    if (draft.type === 'arrow') {
      const next: Annotation = {
        id,
        type: 'arrow',
        pageNumber: draft.pageNumber,
        x: normalizedStart.x,
        y: normalizedStart.y,
        x2: normalizedEnd.x,
        y2: normalizedEnd.y,
        color: baseColor,
        createdAt: Date.now(),
      };

      setAnnotations((prev) => [...prev, next]);
      setSelectedAnnotationId(id);
      setDraft(null);
      message.success('批注已添加');
      return;
    }

    setTextAnnotationDraft({
      type: draft.type,
      pageNumber: draft.pageNumber,
      x: normalizedBox.x,
      y: normalizedBox.y,
      width: normalizedBox.width,
      height: normalizedBox.height,
      color: baseColor,
    });
    setNoteModalOpen(true);
    setDraft(null);
    form.setFieldsValue({ text: '' });
  }, [draft, form, pageSize.height, pageSize.width]);

  const handleAnnotationDragEnd = useCallback(
    (id: string, node: any) => {
      const nextX = node.x();
      const nextY = node.y();
      setAnnotations((prev) =>
        prev.map((item) => {
          if (item.id !== id) {
            return item;
          }

          if (item.type === 'arrow') {
            const deltaX = nextX - item.x * pageSize.width;
            const deltaY = nextY - item.y * pageSize.height;
            return {
              ...item,
              x: pageSize.width > 0 ? nextX / pageSize.width : nextX,
              y: pageSize.height > 0 ? nextY / pageSize.height : nextY,
              x2: (item.x2 ?? item.x) + (pageSize.width > 0 ? deltaX / pageSize.width : deltaX),
              y2: (item.y2 ?? item.y) + (pageSize.height > 0 ? deltaY / pageSize.height : deltaY),
            };
          }

          return {
            ...item,
            x: pageSize.width > 0 ? nextX / pageSize.width : nextX,
            y: pageSize.height > 0 ? nextY / pageSize.height : nextY,
          };
        }),
      );
    },
    [pageSize.height, pageSize.width],
  );

  const handleSaveNote = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!noteDraft && !textAnnotationDraft) {
        return;
      }

      const id = `${textAnnotationDraft ? 'ann' : 'note'}-${Date.now()}`;
      const color = NOTE_COLORS[annotations.length % NOTE_COLORS.length];
      const text = String(values.text || '').trim();
      if (!text) {
        message.warning('请输入批注内容');
        return;
      }

      const next: Annotation = textAnnotationDraft
        ? {
            id,
            type: textAnnotationDraft.type,
            pageNumber: textAnnotationDraft.pageNumber,
            x: textAnnotationDraft.x,
            y: textAnnotationDraft.y,
            width: textAnnotationDraft.width,
            height: textAnnotationDraft.height,
            text,
            color: textAnnotationDraft.color,
            createdAt: Date.now(),
          }
        : {
            id,
            type: 'note',
            pageNumber: noteDraft!.pageNumber,
            x: pageSize.width > 0 ? noteDraft!.x / pageSize.width : noteDraft!.x,
            y: pageSize.height > 0 ? noteDraft!.y / pageSize.height : noteDraft!.y,
            text,
            color,
            createdAt: Date.now(),
          };

      setAnnotations((prev) => [...prev, next]);
      setSelectedAnnotationId(id);
      setNoteModalOpen(false);
      setNoteDraft(null);
      setTextAnnotationDraft(null);
      form.resetFields();
      message.success(textAnnotationDraft ? '文字批注已添加' : '便签批注已添加');
    } catch (error) {
      console.error(error);
    }
  }, [annotations.length, form, noteDraft, pageSize.height, pageSize.width, textAnnotationDraft]);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((item) => item.id !== id));
    setSelectedAnnotationId((prev) => (prev === id ? null : prev));
    message.success('批注已删除');
  }, []);

  const jumpToAnnotation = useCallback((annotation: Annotation) => {
    setCurrentPage(annotation.pageNumber);
    setSelectedAnnotationId(annotation.id);
  }, []);

  const exportJson = useCallback(() => {
    if (!pdfFileMeta) {
      message.warning('请先加载 PDF 文件');
      return;
    }

    const payload = {
      file: pdfFileMeta,
      currentPage,
      zoom,
      annotations,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    downloadBlob(`${fileName || 'pdf-edit-demo'}-annotations.json`, blob);
    message.success('批注 JSON 已导出');
  }, [annotations, currentPage, fileName, pdfFileMeta, zoom]);

  const drawAnnotationToCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      annotation: Annotation,
      scale: number,
      pageWidth: number,
      pageHeight: number,
    ) => {
      ctx.save();
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;

      if (annotation.type === 'rect') {
        const x = annotation.x * pageWidth * scale;
        const y = annotation.y * pageHeight * scale;
        const width = (annotation.width || 0) * pageWidth * scale;
        const height = (annotation.height || 0) * pageHeight * scale;
        ctx.strokeRect(x, y, width, height);
        if (annotation.text) {
          drawAnnotationText(ctx, annotation.text, x, y, width, height, scale);
        }
      } else if (annotation.type === 'highlight') {
        const x = annotation.x * pageWidth * scale;
        const y = annotation.y * pageHeight * scale;
        const width = (annotation.width || 0) * pageWidth * scale;
        const height = (annotation.height || 0) * pageHeight * scale;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x, y, width, height);
        ctx.globalAlpha = 1;
        ctx.strokeRect(x, y, width, height);
      } else if (annotation.type === 'arrow') {
        const startX = annotation.x * pageWidth * scale;
        const startY = annotation.y * pageHeight * scale;
        const endX = (annotation.x2 ?? annotation.x) * pageWidth * scale;
        const endY = (annotation.y2 ?? annotation.y) * pageHeight * scale;
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 16 * scale;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      } else if (annotation.type === 'note') {
        const x = annotation.x * pageWidth * scale;
        const y = annotation.y * pageHeight * scale;
        const width = 180 * scale;
        const height = 72 * scale;
        ctx.fillStyle = '#fffbe6';
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2 * scale;
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#262626';
        ctx.font = `${14 * scale}px sans-serif`;
        const lines = wrapText(ctx, annotation.text || '', width - 16 * scale);
        lines.slice(0, 3).forEach((line, index) => {
          ctx.fillText(line, x + 8 * scale, y + 22 * scale + index * 18 * scale);
        });
      }

      ctx.restore();
    },
    [],
  );

  const exportAnnotatedPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageSize.width || !pageSize.height) {
      message.warning('请先加载并渲染 PDF 页面');
      return;
    }

    const output = document.createElement('canvas');
    output.width = canvas.width;
    output.height = canvas.height;
    const ctx = output.getContext('2d');
    if (!ctx) {
      message.error('无法创建导出画布');
      return;
    }

    ctx.drawImage(canvas, 0, 0);
    const scale = canvas.width / pageSize.width;
    currentPageAnnotations.forEach((annotation) => {
      drawAnnotationToCanvas(ctx, annotation, scale, pageSize.width, pageSize.height);
    });

    const blob = dataUrlToBlob(output.toDataURL('image/png'));
    downloadBlob(`${fileName || 'pdf-edit-demo'}-page-${currentPage}.png`, blob);
    message.success('当前页带批注图片已导出');
  }, [
    currentPage,
    currentPageAnnotations,
    drawAnnotationToCanvas,
    fileName,
    pageSize.height,
    pageSize.width,
  ]);

  const onStageMouseDown = useCallback(
    (event: any) => {
      if (!event?.target || event.target !== event.target.getStage()) {
        return;
      }

      setSelectedAnnotationId(null);
      startDrawing(event.target.getStage());
    },
    [startDrawing],
  );

  const onStageMouseMove = useCallback(
    (event: any) => {
      if (!draft || !event?.target) {
        return;
      }
      updateDrawing(event.target.getStage());
    },
    [draft, updateDrawing],
  );

  const onStageMouseUp = useCallback(() => {
    finishDrawing();
  }, [finishDrawing]);

  const renderAnnotationShape = useCallback(
    (annotation: Annotation) => {
      const isSelected = selectedAnnotationId === annotation.id;
      const styleStroke = isSelected ? '#ff4d4f' : annotation.color;
      const pageWidth = pageSize.width || 1;
      const pageHeight = pageSize.height || 1;

      if (annotation.type === 'arrow') {
        const x = annotation.x * pageWidth;
        const y = annotation.y * pageHeight;
        const endX = (annotation.x2 ?? annotation.x) * pageWidth;
        const endY = (annotation.y2 ?? annotation.y) * pageHeight;

        return (
          <Arrow
            key={annotation.id}
            x={x}
            y={y}
            points={[0, 0, endX - x, endY - y]}
            pointerLength={10}
            pointerWidth={10}
            fill={styleStroke}
            stroke={styleStroke}
            strokeWidth={3}
            draggable
            onClick={() => setSelectedAnnotationId(annotation.id)}
            onTap={() => setSelectedAnnotationId(annotation.id)}
            onDragEnd={(e) => handleAnnotationDragEnd(annotation.id, e.target)}
          />
        );
      }

      if (annotation.type === 'note') {
        return (
          <Group
            key={annotation.id}
            x={annotation.x * pageWidth}
            y={annotation.y * pageHeight}
            draggable
            onClick={() => setSelectedAnnotationId(annotation.id)}
            onTap={() => setSelectedAnnotationId(annotation.id)}
            onDragEnd={(e) => handleAnnotationDragEnd(annotation.id, e.target)}
          >
            <Rect
              width={180}
              height={72}
              cornerRadius={8}
              fill="#fffbe6"
              stroke={styleStroke}
              strokeWidth={isSelected ? 3 : 2}
              shadowBlur={8}
              shadowColor="rgba(0,0,0,0.08)"
            />
            <KonvaText
              x={10}
              y={10}
              width={160}
              height={52}
              text={annotation.text || ''}
              fill="#262626"
              fontSize={14}
              lineHeight={1.4}
              ellipsis
              wrap="word"
            />
          </Group>
        );
      }

      const x = annotation.x * pageWidth;
      const y = annotation.y * pageHeight;
      const width = (annotation.width || 0) * pageWidth;
      const height = (annotation.height || 0) * pageHeight;

      return (
        <Group
          key={annotation.id}
          x={x}
          y={y}
          draggable
          onClick={() => setSelectedAnnotationId(annotation.id)}
          onTap={() => setSelectedAnnotationId(annotation.id)}
          onDragEnd={(e) => handleAnnotationDragEnd(annotation.id, e.target)}
        >
          <Rect
            width={width}
            height={height}
            fill={annotation.type === 'highlight' ? 'rgba(250, 204, 21, 0.35)' : 'rgba(22, 119, 255, 0.06)'}
            stroke={styleStroke}
            strokeWidth={isSelected ? 3 : 2}
            dash={annotation.type === 'highlight' ? [8, 4] : [0]}
          />
          {annotation.text && (
            <KonvaText
              x={8}
              y={8}
              width={Math.max(width - 16, 20)}
              height={Math.max(height - 16, 20)}
              text={annotation.text}
              fill="#262626"
              fontSize={14}
              lineHeight={1.35}
              ellipsis
              wrap="word"
            />
          )}
        </Group>
      );
    },
    [handleAnnotationDragEnd, pageSize.height, pageSize.width, selectedAnnotationId],
  );

  const getToolLabel = (value: ToolType) => {
    switch (value) {
      case 'select':
        return '选择';
      case 'rect':
        return '框选';
      case 'highlight':
        return '高亮';
      case 'arrow':
        return '箭头';
      case 'note':
        return '便签';
      default:
        return value;
    }
  };

  const toolButtons = [
    {
      key: 'select',
      icon: <SelectOutlined />,
      label: '选择',
      tip: '选中并移动已存在的批注',
    },
    {
      key: 'rect',
      icon: <PlusSquareOutlined />,
      label: '框选',
      tip: '拖拽画一个矩形批注',
    },
    {
      key: 'highlight',
      icon: <HighlightOutlined />,
      label: '高亮',
      tip: '拖拽画一个半透明高亮',
    },
    {
      key: 'arrow',
      icon: <LineOutlined />,
      label: '箭头',
      tip: '拖拽画一个箭头指示',
    },
    {
      key: 'note',
      icon: <EditOutlined />,
      label: '便签',
      tip: '单击页面添加说明便签',
    },
  ] as const;

  return (
    <PageContainer
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>

        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space wrap>
                <Upload
                  accept=".pdf,application/pdf"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void handleUploadFile(file as File);
                    return false;
                  }}
                >
                  <Button type="primary" icon={<FilePdfOutlined />} loading={fileLoading}>
                    上传 PDF
                  </Button>
                </Upload>
                <Button icon={<SafetyOutlined />} onClick={loadSamplePdf} loading={fileLoading}>
                  加载示例 PDF
                </Button>
                <Divider type="vertical" />
                {toolButtons.map((item) => (
                  <Tooltip title={item.tip} key={item.key}>
                    <Button
                      type={tool === item.key ? 'primary' : 'default'}
                      icon={item.icon}
                      onClick={() => setTool(item.key)}
                    >
                      {item.label}
                    </Button>
                  </Tooltip>
                ))}
              </Space>
            </Col>
            <Col>
              <Space wrap>
                <Button
                  icon={<LeftOutlined />}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  上一页
                </Button>
                <Button
                  icon={<RightOutlined />}
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                >
                  下一页
                </Button>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                >
                  缩小
                </Button>
                <Button
                  icon={<ArrowRightOutlined />}
                  onClick={() => setZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
                >
                  放大
                </Button>
                <Button icon={<DownloadOutlined />} onClick={exportAnnotatedPng}>
                  导出当前页 PNG
                </Button>
                <Button onClick={exportJson}>导出批注 JSON</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={16} align="stretch">
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                minHeight: '76vh',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
              }}
              bodyStyle={{ height: '100%' }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <Space wrap>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      预览区
                    </Typography.Title>
                    <Tag color="blue">{getToolLabel(tool)}</Tag>
                    <Tag>{fileName || '未加载文件'}</Tag>
                    <Tag color="geekblue">
                      第 {currentPage} / {pageCount || 0} 页
                    </Tag>
                    <Tag color="green">缩放 {Math.round(zoom * 100)}%</Tag>
                  </Space>
                  <Space wrap>
                    <Button danger ghost icon={<ClearOutlined />} onClick={clearCurrentPage}>
                      清空本页
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={clearAll}>
                      清空全部
                    </Button>
                  </Space>
                </div>

                <Spin
                  spinning={fileLoading || renderLoading}
                  tip={fileLoading ? '加载 PDF 中...' : '渲染页面中...'}
                >
                  <div
                    style={{
                      minHeight: 620,
                      background:
                        'linear-gradient(180deg, rgba(245, 247, 250, 0.85), rgba(255, 255, 255, 0.95))',
                      border: '1px solid #f0f0f0',
                      borderRadius: 16,
                      padding: 24,
                      overflow: 'auto',
                    }}
                  >
                    {!pdfDoc ? (
                      <div
                        style={{
                          minHeight: 520,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Empty
                          description={
                            <Space direction="vertical" size={4}>
                              <span>请先上传一个 PDF 文件</span>
                              <span>或者点击“加载示例 PDF”快速体验</span>
                            </Space>
                          }
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          <canvas
                            ref={canvasRef}
                            style={{
                              display: 'block',
                              borderRadius: 12,
                              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                              background: '#fff',
                            }}
                          />

                          {pageSize.width > 0 && pageSize.height > 0 && (
                            <Stage
                              ref={stageRef}
                              width={pageSize.width}
                              height={pageSize.height}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                              }}
                              onMouseDown={onStageMouseDown}
                              onMouseMove={onStageMouseMove}
                              onMouseUp={onStageMouseUp}
                            >
                              <Layer>
                                {currentPageAnnotations.map((annotation) =>
                                  renderAnnotationShape(annotation),
                                )}

                                {draft &&
                                  draft.pageNumber === currentPage &&
                                  draft.type !== 'arrow' && (
                                    <Rect
                                      x={
                                        normalizeBox(
                                          draft.startX,
                                          draft.startY,
                                          draft.endX,
                                          draft.endY,
                                        ).x
                                      }
                                      y={
                                        normalizeBox(
                                          draft.startX,
                                          draft.startY,
                                          draft.endX,
                                          draft.endY,
                                        ).y
                                      }
                                      width={
                                        normalizeBox(
                                          draft.startX,
                                          draft.startY,
                                          draft.endX,
                                          draft.endY,
                                        ).width
                                      }
                                      height={
                                        normalizeBox(
                                          draft.startX,
                                          draft.startY,
                                          draft.endX,
                                          draft.endY,
                                        ).height
                                      }
                                      fill={
                                        draft.type === 'highlight'
                                          ? 'rgba(250, 204, 21, 0.30)'
                                          : 'rgba(22, 119, 255, 0.08)'
                                      }
                                      stroke={draft.type === 'highlight' ? '#fadb14' : '#1677ff'}
                                      strokeWidth={2}
                                      dash={draft.type === 'highlight' ? [6, 4] : [4, 4]}
                                      listening={false}
                                    />
                                  )}

                                {draft &&
                                  draft.pageNumber === currentPage &&
                                  draft.type === 'arrow' && (
                                    <Arrow
                                      x={0}
                                      y={0}
                                      points={[draft.startX, draft.startY, draft.endX, draft.endY]}
                                      pointerLength={10}
                                      pointerWidth={10}
                                      fill="#fa8c16"
                                      stroke="#fa8c16"
                                      strokeWidth={3}
                                      listening={false}
                                    />
                                  )}
                              </Layer>
                            </Stage>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Spin>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                }}
                title="批注列表"
                extra={<Tag color="blue">{currentPageAnnotations.length} 条</Tag>}
              >
                {currentPageAnnotations.length ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={currentPageAnnotations}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button type="link" size="small" onClick={() => jumpToAnnotation(item)}>
                            定位
                          </Button>,
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={() => deleteAnnotation(item.id)}
                          >
                            删除
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space wrap>
                              <Tag
                                color={
                                  item.type === 'highlight'
                                    ? 'gold'
                                    : item.type === 'note'
                                      ? 'purple'
                                      : 'blue'
                                }
                              >
                                {getAnnotationTitle(item)}
                              </Tag>
                              {selectedAnnotationId === item.id && <Tag color="red">已选中</Tag>}
                            </Space>
                          }
                          description={
                            <div style={{ lineHeight: 1.6 }}>
                              <div>页码：第 {item.pageNumber} 页</div>
                              {item.type !== 'arrow' && (
                                <div>
                                  位置：{Math.round(item.x * 100)}%，{Math.round(item.y * 100)}%
                                </div>
                              )}
                              {item.type === 'arrow' && (
                                <div>
                                  起点：{Math.round(item.x * 100)}%，{Math.round(item.y * 100)}%
                                </div>
                              )}
                              {item.text && <div style={{ marginTop: 4 }}>内容：{item.text}</div>}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="本页还没有批注" />
                )}
              </Card>

              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                }}
                title="文件信息"
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>文件名：{fileName || '-'}</div>
                  <div>页数：{pageCount || '-'}</div>
                  <div>缩放：{Math.round(zoom * 100)}%</div>
                  <div>批注总数：{annotations.length}</div>
                  <div>当前工具：{getToolLabel(tool)}</div>
                  <Divider style={{ margin: '12px 0' }} />
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    说明：框选、高亮、箭头和便签都只保存到批注数据里，不直接改写 PDF
                    原文件。真正的“最终版 PDF”通常由后端根据批注记录再异步压平生成。
                  </Typography.Paragraph>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>

      <Modal
        title={textAnnotationDraft ? '添加框选文字批注' : '添加便签批注'}
        open={noteModalOpen}
        onOk={handleSaveNote}
        onCancel={() => {
          setNoteModalOpen(false);
          setNoteDraft(null);
          setTextAnnotationDraft(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="text"
            label="批注内容"
            rules={[{ required: true, message: '请输入批注内容' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={
                textAnnotationDraft
                  ? '请输入这块框选区域对应的说明文字'
                  : '请输入说明、复核意见或审批备注'
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .ant-upload {
          display: inline-block;
        }
      `}</style>
    </PageContainer>
  );
};

const drawAnnotationText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
) => {
  ctx.fillStyle = '#262626';
  ctx.font = `${14 * scale}px sans-serif`;
  const padding = 8 * scale;
  const lineHeight = 18 * scale;
  const lines = wrapText(ctx, text, Math.max(width - padding * 2, 20 * scale));
  lines.slice(0, Math.max(1, Math.floor((height - padding * 2) / lineHeight))).forEach((line, index) => {
    ctx.fillText(line, x + padding, y + padding + 14 * scale + index * lineHeight);
  });
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const content = text || '';
  if (!content) {
    return [''];
  }

  const words = content.split('');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((char) => {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const dataUrlToBlob = (dataUrl: string) => {
  const [meta, base64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'image/png';
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
};

export default PdfEditPage;
