import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

import '../../shared/utils/file_utils.dart';
import '../../shared/utils/format_utils.dart';
import '../../l10n/app_localizations.dart';

/// Widget for selecting files to transfer
class FilePickerWidget extends StatefulWidget {
  final void Function(List<SelectedFile> files) onFilesSelected;
  final bool allowMultiple;
  final List<String>? allowedExtensions;

  const FilePickerWidget({
    super.key,
    required this.onFilesSelected,
    this.allowMultiple = true,
    this.allowedExtensions,
  });

  @override
  State<FilePickerWidget> createState() => _FilePickerWidgetState();
}

class _FilePickerWidgetState extends State<FilePickerWidget> {
  final List<SelectedFile> _selectedFiles = [];
  bool _isLoading = false;

  Future<void> _pickFiles() async {
    setState(() => _isLoading = true);

    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: widget.allowMultiple,
        withData: true,
        allowedExtensions: widget.allowedExtensions,
        type: widget.allowedExtensions != null
            ? FileType.custom
            : FileType.any,
      );

      if (result != null) {
        final files = result.files
            .where((f) => f.bytes != null)
            .map((f) => SelectedFile(
                  name: f.name,
                  size: f.size,
                  bytes: f.bytes!,
                  extension: f.extension,
                ))
            .toList();

        setState(() {
          _selectedFiles.addAll(files);
        });

        widget.onFilesSelected(_selectedFiles);
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _removeFile(int index) {
    setState(() {
      _selectedFiles.removeAt(index);
    });
    widget.onFilesSelected(_selectedFiles);
  }

  void _clearAll() {
    setState(() {
      _selectedFiles.clear();
    });
    widget.onFilesSelected(_selectedFiles);
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Drop zone / pick button
        InkWell(
          onTap: _isLoading ? null : _pickFiles,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              border: Border.all(
                color: theme.colorScheme.outline.withOpacity(0.3),
                width: 2,
              ),
              borderRadius: BorderRadius.circular(16),
              color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_isLoading)
                  const CircularProgressIndicator()
                else ...[
                  Icon(
                    Icons.cloud_upload_outlined,
                    size: 48,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n?.tapToSelectFiles ?? 'Tap to select files',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n?.dragAndDropFiles ?? 'Or drag and drop files here',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),

        // Selected files list
        if (_selectedFiles.isNotEmpty) ...[
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${l10n?.selectedFiles ?? 'Selected Files'} (${_selectedFiles.length})',
                style: theme.textTheme.titleSmall,
              ),
              TextButton(
                onPressed: _clearAll,
                child: Text(l10n?.clearAll ?? 'Clear All'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...List.generate(
            _selectedFiles.length,
            (index) => _SelectedFileCard(
              file: _selectedFiles[index],
              onRemove: () => _removeFile(index),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                '${l10n?.totalSize ?? 'Total size'}: ${FormatUtils.formatFileSize(_selectedFiles.fold(0, (sum, f) => sum + f.size))}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _SelectedFileCard extends StatelessWidget {
  final SelectedFile file;
  final VoidCallback onRemove;

  const _SelectedFileCard({
    required this.file,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            FileUtils.getIconForExtension(file.extension),
            color: theme.colorScheme.onPrimaryContainer,
          ),
        ),
        title: Text(
          file.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(FormatUtils.formatFileSize(file.size)),
        trailing: IconButton(
          icon: const Icon(Icons.close),
          onPressed: onRemove,
        ),
      ),
    );
  }
}

/// Represents a selected file
class SelectedFile {
  final String name;
  final int size;
  final Uint8List bytes;
  final String? extension;

  SelectedFile({
    required this.name,
    required this.size,
    required this.bytes,
    this.extension,
  });
}

/// Dialog for selecting files
class FilePickerDialog extends StatefulWidget {
  final bool allowMultiple;

  const FilePickerDialog({
    super.key,
    this.allowMultiple = true,
  });

  @override
  State<FilePickerDialog> createState() => _FilePickerDialogState();
}

class _FilePickerDialogState extends State<FilePickerDialog> {
  List<SelectedFile> _selectedFiles = [];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return AlertDialog(
      title: Text(l10n?.selectFiles ?? 'Select Files'),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: FilePickerWidget(
          onFilesSelected: (files) {
            setState(() => _selectedFiles = files);
          },
          allowMultiple: widget.allowMultiple,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(l10n?.cancel ?? 'Cancel'),
        ),
        FilledButton(
          onPressed: _selectedFiles.isEmpty
              ? null
              : () => Navigator.pop(context, _selectedFiles),
          child: Text(l10n?.send ?? 'Send'),
        ),
      ],
    );
  }
}

/// Show file picker dialog and return selected files
Future<List<SelectedFile>?> showFilePickerDialog(
  BuildContext context, {
  bool allowMultiple = true,
}) async {
  return showDialog<List<SelectedFile>>(
    context: context,
    builder: (context) => FilePickerDialog(allowMultiple: allowMultiple),
  );
}
