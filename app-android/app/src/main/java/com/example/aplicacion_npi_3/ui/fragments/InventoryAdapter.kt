package com.example.aplicacion_npi_3.ui.fragments

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R

class InventoryAdapter(
    private val displayList: List<Pair<String, String>>,
    private val language: String
) : RecyclerView.Adapter<InventoryAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val icon: ImageView = view.findViewById(R.id.iv_item_icon)
        val name: TextView = view.findViewById(R.id.tv_item_name)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_inventory, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val (category, detail) = displayList[position]

        // Usamos los originales para la lógica, pero mostramos los traducidos
        val isEn = (language == "en")
        val displayCat = if (isEn) translateTerm(category) else category
        val displayDet = if (isEn) translateTerm(detail) else detail

        // Formatear texto (ej: "HELMET\nGOLD" o "DIAMOND")
        holder.name.text = if (category == detail) displayCat else "$displayCat\n$displayDet"


        //  LÓGICA DE ICONOS
        val context = holder.itemView.context

        // Construimos el nombre del recurso: ic_item_diamante o ic_equip_casco_oro
        val resourceName = if (category == detail) {
            "ic_item_${category.lowercase()}"
        } else {
            "ic_equip_${category.lowercase()}_${detail.lowercase()}"
        }

        // Buscamos si existe ese drawable
        var resId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)

        // Fallback: si no encuentra ic_item_piedra, busca block_piedra
        if (resId == 0 && category == detail) {
            resId = context.resources.getIdentifier("block_${category.lowercase()}", "drawable", context.packageName)
        }

        if (resId != 0) {
            holder.icon.setImageResource(resId)
        } else {
            holder.icon.setImageResource(android.R.drawable.ic_menu_help)
        }
    }

    override fun getItemCount() = displayList.size

    // Diccionario auxiliar
    private fun translateTerm(term: String): String {
        return when (term.uppercase()) {
            // EQUIPO
            "CASCO" -> "HELMET"
            "PETO" -> "CHESTPLATE"
            "PANTALONES" -> "LEGGINGS"
            "BOTAS" -> "BOOTS"
            "ESPADA" -> "SWORD"
            "PICO" -> "PICKAXE"
            // MATERIALES
            "ORO" -> "GOLD"
            "HIERRO" -> "IRON"
            "DIAMANTE" -> "DIAMOND"
            "PIEDRA" -> "STONE"
            "MADERA" -> "WOOD"
            "OBSIDIANA" -> "OBSIDIAN"
            "CARBON" -> "COAL"
            "ESMERALDA" -> "EMERALD"
            "REDSTONE" -> "REDSTONE"
            "CUARZO" -> "QUARTZ"
            "RECOMPENSA_MULTIPLE" -> "BUNDLE"
            else -> term
        }
    }
}