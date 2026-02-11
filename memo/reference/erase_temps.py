#!/usr/bin/env python3
"""
このプロジェクトのルート直下にあるtmpclaudeから始まるファイル、
小文字にするとnulと一致するファイルを再帰的に探索し、見つかったら削除するスクリプト。
"""

import os
import subprocess
from pathlib import Path


def delete_file_windows(file_path: Path) -> bool:
    """
    Windowsで予約デバイス名（NULなど）を含むファイルを削除する。

    Args:
        file_path: 削除するファイルのパス

    Returns:
        削除に成功した場合はTrue、失敗した場合はFalse
    """
    # Windowsの長いパス形式（\\?\プレフィックス）を使用
    extended_path = f"\\\\?\\{file_path.resolve()}"

    try:
        # os.removeで試す（\\?\プレフィックス付き）
        try:
            os.remove(extended_path)
            return True
        except:
            pass

        # subprocessでWindows del コマンドを使う
        result = subprocess.run(
            ["cmd", "/c", "del", "/f", "/q", extended_path],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0
    except Exception as e:
        print(f"削除エラー詳細: {e}")
        return False


def find_and_delete_temp_files(root_dir: Path, dry_run: bool = False) -> None:
    """
    指定されたルートディレクトリから一時ファイルを再帰的に検索して削除する。

    Args:
        root_dir: 検索を開始するルートディレクトリ
        dry_run: Trueの場合、実際には削除せずに削除対象を表示するのみ
    """
    deleted_count = 0

    # ルートディレクトリ配下を再帰的に探索
    for item in root_dir.rglob("*"):
        # ファイルのみを対象とする（ディレクトリは対象外）
        if not item.is_file():
            continue

        file_name = item.name

        # 条件1: tmpclaudeで始まるファイル
        if file_name.startswith("tmpclaude"):
            if dry_run:
                print(f"[DRY RUN] 削除対象: {item}")
            else:
                try:
                    item.unlink()
                    print(f"削除しました: {item}")
                    deleted_count += 1
                except Exception as e:
                    print(f"削除エラー: {item} - {e}")

        # 条件2: 小文字にするとnulと一致するファイル（Windows予約名対応）
        elif file_name.lower() == "nul":
            if dry_run:
                print(f"[DRY RUN] 削除対象: {item}")
            else:
                print(f"削除中 (Windows予約名): {item}")
                if delete_file_windows(item):
                    print(f"削除しました: {item}")
                    deleted_count += 1
                else:
                    print(f"削除失敗: {item}")

    if dry_run:
        print("\n[DRY RUN] 実際には削除していません")
    else:
        print(f"\n合計 {deleted_count} 個のファイルを削除しました")


def main() -> None:
    """メイン処理"""
    # このスクリプトの場所から2つ上のディレクトリをプロジェクトルートとする
    # memo/reference/erase_temps.py -> memo/reference -> memo -> プロジェクトルート
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent.parent

    print(f"プロジェクトルート: {project_root}")
    print("一時ファイルを検索中...\n")

    # 最初はドライランで確認
    print("=== ドライラン（削除対象の確認） ===")
    find_and_delete_temp_files(project_root, dry_run=True)

    # ユーザーに確認
    print("\n上記のファイルを削除しますか？ (y/N): ", end="")
    response = input().strip().lower()

    if response == "y":
        print("\n=== 削除実行 ===")
        find_and_delete_temp_files(project_root, dry_run=False)
    else:
        print("キャンセルしました")


if __name__ == "__main__":
    main()
