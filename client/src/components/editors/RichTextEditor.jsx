import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaLink,
  FaImage,
  FaTasks,
  FaHighlighter,
} from 'react-icons/fa';

import { AiOutlineClear } from 'react-icons/ai';
import { VscClearAll } from 'react-icons/vsc';
import { MdFormatColorText } from 'react-icons/md';

const MenuBar = ({ editor }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [textColor, setTextColor] = useState('#000000');

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-2 mb-4 flex flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        title="Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        title="Strike"
      >
        <FaStrikethrough />
      </button>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <FaListUl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Ordered List"
      >
        <FaListOl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('taskList') ? 'bg-gray-200' : ''}`}
        title="Task List"
      >
        <FaTasks />
      </button>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        title="Quote"
      >
        <FaQuoteLeft />
      </button>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
        title="Align Left"
      >
        <FaAlignLeft />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
        title="Align Center"
      >
        <FaAlignCenter />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
        title="Align Right"
      >
        <FaAlignRight />
      </button>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <div className="relative">
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
          title="Link"
        >
          <FaLink />
        </button>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded p-2 z-10 flex">
            <input 
              type="text" 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
            />
            <button 
              onClick={addLink}
              className="ml-2 bg-blue-500 text-white rounded px-2 py-1 text-sm"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowImageInput(!showImageInput)}
          className={`p-2 rounded hover:bg-gray-100`}
          title="Image"
        >
          <FaImage />
        </button>
        {showImageInput && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded p-2 z-10 flex">
            <input 
              type="text" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
            />
            <button 
              onClick={addImage}
              className="ml-2 bg-blue-500 text-white rounded px-2 py-1 text-sm"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-gray-200' : ''}`}
        title="Highlight"
      >
        <FaHighlighter />
      </button>

      <div className="relative">
        <input
          type="color"
          value={textColor}
          onChange={(e) => {
            setTextColor(e.target.value);
            editor.chain().focus().setColor(e.target.value).run();
          }}
          className="w-0 h-0 opacity-0 absolute"
          id="text-color"
        />
        <label 
          htmlFor="text-color" 
          className={`p-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center`}
          title="Text Color"
        >
          <MdFormatColorText style={{ color: textColor }} />
        </label>
      </div>

      <span className="w-px h-6 mx-1 bg-gray-300 self-center"></span>

      <button
        onClick={() => editor.chain().focus().unsetLink().run()}
        className={`p-2 rounded hover:bg-gray-100`}
        title="Clear Formatting"
        disabled={!editor.isActive('link')}
      >
        <AiOutlineClear />
      </button>
      <button
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className="p-2 rounded hover:bg-gray-100"
        title="Clear All Formatting"
      >
        <VscClearAll />
      </button>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder = 'Write something...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none" 
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;