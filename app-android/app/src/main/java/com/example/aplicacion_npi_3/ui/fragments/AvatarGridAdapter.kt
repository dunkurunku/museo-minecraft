package com.example.aplicacion_npi_3.ui.fragments

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R

class AvatarGridAdapter(
    private val pixels: IntArray
) : RecyclerView.Adapter<AvatarGridAdapter.PixelViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PixelViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_pixel, parent, false)
        return PixelViewHolder(view)
    }

    override fun onBindViewHolder(holder: PixelViewHolder, position: Int) {
        val pixelView = holder.itemView.findViewById<View>(R.id.pixel_view)
        pixelView.setBackgroundColor(pixels[position])
    }

    override fun getItemCount() = 64

    class PixelViewHolder(view: View) : RecyclerView.ViewHolder(view)
}