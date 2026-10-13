package com.example.aplicacion_npi_3.ui.fragments

import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.Achievement

class AchievementsAdapter(
    private val achievements: List<Achievement>,
    private val onAchievementClick: (Achievement) -> Unit
) : RecyclerView.Adapter<AchievementsAdapter.AchievementViewHolder>() {

    private var selectedPosition = -1

    class AchievementViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val icon: ImageView = view.findViewById(R.id.ivAchievementIcon)
        val selectionBorder: View = view.findViewById(R.id.viewSelectionBorder)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AchievementViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_achievement, parent, false)
        return AchievementViewHolder(view)
    }

    override fun onBindViewHolder(holder: AchievementViewHolder, position: Int) {
        val item = achievements[position]
        holder.icon.setImageResource(item.iconResId)

        if (item.isUnlocked) {
            holder.icon.colorFilter = null
            holder.icon.alpha = 1.0f
        } else {
            val matrix = ColorMatrix()
            matrix.setSaturation(0f)
            holder.icon.colorFilter = ColorMatrixColorFilter(matrix)
            holder.icon.alpha = 0.5f
        }

        if (selectedPosition == position) {
            holder.selectionBorder.visibility = View.VISIBLE
        } else {
            holder.selectionBorder.visibility = View.GONE
        }

        holder.itemView.setOnClickListener {
            val previousItem = selectedPosition
            selectedPosition = holder.adapterPosition
            notifyItemChanged(previousItem)
            notifyItemChanged(selectedPosition)
            onAchievementClick(item)
        }
    }

    override fun getItemCount() = achievements.size
}