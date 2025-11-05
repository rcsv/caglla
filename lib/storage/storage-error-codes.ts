/**
 * Firebase Storage エラーコード
 * CodeRabbit提案に基づく標準化されたエラーコード
 */

import type { TranslationKey } from '@/lib/i18n'

/**
 * Firebase Storage エラーコードのenum定義
 */
export enum StorageErrorCode {
  STORAGE_UNAUTHORIZED = 'STORAGE_UNAUTHORIZED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_CANCELED = 'STORAGE_CANCELED',
  STORAGE_INVALID_FORMAT = 'STORAGE_INVALID_FORMAT',
  STORAGE_OBJECT_NOT_FOUND = 'STORAGE_OBJECT_NOT_FOUND',
  STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
  STORAGE_UNKNOWN = 'STORAGE_UNKNOWN',
  STORAGE_INVALID_ARGUMENT = 'STORAGE_INVALID_ARGUMENT',
  STORAGE_INVALID_CHECKSUM = 'STORAGE_INVALID_CHECKSUM',
  STORAGE_INVALID_NAME = 'STORAGE_INVALID_NAME',
  STORAGE_PROJECT_NOT_FOUND = 'STORAGE_PROJECT_NOT_FOUND',
  STORAGE_UNAUTHENTICATED = 'STORAGE_UNAUTHENTICATED',
}

/**
 * Firebase Storageエラーを標準化されたエラーコードに変換
 * 
 * @param error - Firebase Storageエラー
 * @returns 標準化されたエラーコード
 */
export function normalizeStorageError(error: Error): StorageErrorCode {
  const message = error.message.toLowerCase()
  
  if (message.includes('storage/unauthorized')) {
    return StorageErrorCode.STORAGE_UNAUTHORIZED
  }
  if (message.includes('storage/quota-exceeded')) {
    return StorageErrorCode.STORAGE_QUOTA_EXCEEDED
  }
  if (message.includes('storage/canceled')) {
    return StorageErrorCode.STORAGE_CANCELED
  }
  if (message.includes('storage/invalid-format')) {
    return StorageErrorCode.STORAGE_INVALID_FORMAT
  }
  if (message.includes('storage/object-not-found')) {
    return StorageErrorCode.STORAGE_OBJECT_NOT_FOUND
  }
  if (message.includes('storage/unauthenticated')) {
    return StorageErrorCode.STORAGE_UNAUTHENTICATED
  }
  if (message.includes('storage/invalid-argument')) {
    return StorageErrorCode.STORAGE_INVALID_ARGUMENT
  }
  if (message.includes('storage/invalid-checksum')) {
    return StorageErrorCode.STORAGE_INVALID_CHECKSUM
  }
  if (message.includes('storage/invalid-name')) {
    return StorageErrorCode.STORAGE_INVALID_NAME
  }
  if (message.includes('storage/project-not-found')) {
    return StorageErrorCode.STORAGE_PROJECT_NOT_FOUND
  }
  if (message.includes('storage/unknown')) {
    return StorageErrorCode.STORAGE_UNKNOWN
  }
  
  // デフォルトは未知のエラー
  return StorageErrorCode.STORAGE_UNKNOWN
}

/**
 * ストレージエラーコードをi18nキーにマッピング
 * 
 * @param errorCode - ストレージエラーコード
 * @returns i18n翻訳キー
 */
export function getStorageErrorI18nKey(errorCode: StorageErrorCode): TranslationKey {
  const mapping: Record<StorageErrorCode, TranslationKey> = {
    [StorageErrorCode.STORAGE_UNAUTHORIZED]: 'imageUpload.error.auth',
    [StorageErrorCode.STORAGE_QUOTA_EXCEEDED]: 'imageUpload.error.quotaExceeded',
    [StorageErrorCode.STORAGE_CANCELED]: 'imageUpload.error.canceled',
    [StorageErrorCode.STORAGE_INVALID_FORMAT]: 'imageUpload.error.invalidFormat',
    [StorageErrorCode.STORAGE_OBJECT_NOT_FOUND]: 'imageUpload.error.objectNotFound',
    [StorageErrorCode.STORAGE_UPLOAD_FAILED]: 'imageUpload.error.uploadFailed',
    [StorageErrorCode.STORAGE_UNKNOWN]: 'imageUpload.error.unknown',
    [StorageErrorCode.STORAGE_INVALID_ARGUMENT]: 'imageUpload.error.invalidArgument',
    [StorageErrorCode.STORAGE_INVALID_CHECKSUM]: 'imageUpload.error.invalidChecksum',
    [StorageErrorCode.STORAGE_INVALID_NAME]: 'imageUpload.error.invalidName',
    [StorageErrorCode.STORAGE_PROJECT_NOT_FOUND]: 'imageUpload.error.projectNotFound',
    [StorageErrorCode.STORAGE_UNAUTHENTICATED]: 'imageUpload.error.unauthenticated',
  }
  
  return mapping[errorCode] || 'imageUpload.error.unknown'
}

/**
 * エラーコードからエラーメッセージを取得（i18n対応）
 * 
 * @param errorCode - ストレージエラーコード
 * @param language - 言語コード（オプション）
 * @returns 翻訳されたエラーメッセージ
 */
export function getStorageErrorMessage(errorCode: StorageErrorCode, language?: string): string {
  const { t } = require('@/lib/i18n')
  const i18nKey = getStorageErrorI18nKey(errorCode)
  return t(i18nKey, language)
}

