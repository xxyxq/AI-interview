/**
 * Interview Store - Zustand 状态管理
 * 
 * 统一管理面试应用的所有状态，包括：
 * - 会话管理 (sessions, currentSession)
 * - 聊天状态 (messages, streaming)
 * - 面试上下文 (resume, jobDescription, progress)
 * - API 配置 (apiConfig)
 * - 语音模式状态 (isVoiceMode)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// 导入类型和常量
export * from './types';
import type { ApiConfig, ModelConfig } from './types';

// 导入 slices
import { createSessionSlice, type SessionSlice } from './slices/sessionSlice';
import { createInterviewSlice, type InterviewFlowSlice } from './slices/interviewSlice';
import { createApiConfigSlice, type ApiConfigSlice } from './slices/apiConfigSlice';
import { createResumeSlice, type ResumeSlice } from './slices/resumeSlice';

// ============================================================================
// Store 类型定义
// ============================================================================

// 组合所有 slice 类型
export type InterviewStore = SessionSlice & InterviewFlowSlice & ApiConfigSlice & ResumeSlice;

// ============================================================================
// 辅助：判断一个模型是否属于"语音 / Omni 多模态"模型
// - 用于 hydrate 兜底 & SettingsDialog 下拉过滤，保持口径一致
// ============================================================================
export function isVoiceCandidateModel(m: { model?: string }): boolean {
    const t = (m.model || "").toLowerCase();
    return (
        t.includes("omni") ||
        t.startsWith("deepseek-v4") ||
        t.includes("audio-instruct") ||
        t.includes("qwen2.5-omni")
    );
}

// ============================================================================
// hydrate 兜底：如果用户本地还没有任何可用的语音模型，自动插入一条
// "DeepSeek-V4-Flash（语音测试）" 模板，并把它绑定为 voiceModelId。
// - apiKey 优先复用现有任何 provider=deepseek 的配置
// - base_url / model 都填死 DeepSeek 官方正确值
// ============================================================================
function ensureVoiceModelTemplate(apiConfig: ApiConfig): ApiConfig {
    const hasValidVoiceBinding = !!(
        apiConfig.voiceModelId &&
        apiConfig.models.find(m => m.id === apiConfig.voiceModelId && isVoiceCandidateModel(m))
    );
    const hasAnyVoiceCandidate = apiConfig.models.some(isVoiceCandidateModel);
    if (hasValidVoiceBinding && hasAnyVoiceCandidate) return apiConfig;

    // 复用现有 DeepSeek 的 key（能省一步是一步）
    const deepseekSibling = apiConfig.models.find(m =>
        (m.provider || "").toLowerCase() === "deepseek" ||
        (m.baseUrl || "").toLowerCase().includes("deepseek.com")
    );

    const template: ModelConfig = {
        id: uuidv4(),
        name: "DeepSeek-V4-Flash（语音测试）",
        provider: "deepseek",
        apiKey: deepseekSibling?.apiKey || "",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        createdAt: new Date().toISOString(),
    };

    const newModels = [...apiConfig.models, template];
    return {
        ...apiConfig,
        models: newModels,
        voiceModelId: apiConfig.voiceModelId || template.id,
        // 注意：smart/fast 等保持不变，不要乱覆盖；addModel 里的"第一个模型兜底设为全部"是手动添加才触发，
        // 这里是系统自动补的语音专用模板，只绑定 voice 通道即可。
    };
}

// ============================================================================
// Store 实现
// ============================================================================

export const useInterviewStore = create<InterviewStore>()(
    persist(
        (set, get) => ({
            // 组合所有 slices
            ...createSessionSlice(
                set as Parameters<typeof createSessionSlice>[0],
                get as Parameters<typeof createSessionSlice>[1]
            ),
            ...createInterviewSlice(
                set as Parameters<typeof createInterviewSlice>[0],
                get as Parameters<typeof createInterviewSlice>[1]
            ),
            ...createApiConfigSlice(
                set as Parameters<typeof createApiConfigSlice>[0],
                get as Parameters<typeof createApiConfigSlice>[1]
            ),
            ...createResumeSlice(
                set as Parameters<typeof createResumeSlice>[0],
                get as Parameters<typeof createResumeSlice>[1]
            ),
        }),
        {
            name: 'interview-store',
            storage: createJSONStorage(() => localStorage),
            // 只持久化 API 配置
            partialize: (state) => ({
                apiConfig: state.apiConfig,
            }),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                try {
                    const original = state.apiConfig;
                    const fixed = ensureVoiceModelTemplate(original);
                    if (fixed !== original) {
                        state.apiConfig = fixed;
                        // 仅在确实需要自动注入时输出一行提示，方便在 Console 里看到
                        // eslint-disable-next-line no-console
                        console.info(
                            "[Store][Hydrate] 未发现语音模型，自动注入了 DeepSeek-V4-Flash（语音测试）模板。" +
                            "请到设置 → 模型分配 → 语音面试，点击编辑补填 API Key。"
                        );
                    }
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error("[Store][Hydrate] 自动注入语音模板失败：", err);
                }
            },
        }
    )
);
